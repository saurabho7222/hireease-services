import path from 'node:path';
import fs from 'node:fs';
import { db, bucket, user, isStaff, sameOrigin, json, fail, ApiError } from '@/lib/server';

/**
 * Saves resume file directly into public/resumes within the project.
 * Uses direct fs write when running in Node.js, and falls back to dev server bridge
 * when running inside worker sandboxes.
 */
async function saveResumeToPublic(fileName: string, bytes: Uint8Array): Promise<string> {
  // 1. Direct host Node.js filesystem write
  try {
    const resumesDir = path.join(process.cwd(), 'public', 'resumes');
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }
    const targetPath = path.join(resumesDir, fileName);
    fs.writeFileSync(targetPath, bytes);
    return `/resumes/${fileName}`;
  } catch {
    // 2. Dev server bridge write to public/resumes
    const res = await fetch('http://127.0.0.1:5173/__hireease_resume_bridge/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Resume-Filename': fileName
      },
      body: Buffer.from(bytes)
    });
    if (!res.ok) {
      throw new Error('Could not save resume to public folder: ' + await res.text());
    }
    return `/resumes/${fileName}`;
  }
}

/**
 * Removes previous resume file from public/resumes if present.
 */
async function deleteResumeFromPublic(keyOrFileName: string): Promise<void> {
  const fileName = path.basename(keyOrFileName);
  try {
    const resumesDir = path.join(process.cwd(), 'public', 'resumes');
    const targetPath = path.join(resumesDir, fileName);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return;
    }
  } catch {}

  try {
    await fetch('http://127.0.0.1:5173/__hireease_resume_bridge/delete', {
      method: 'POST',
      headers: {
        'X-Resume-Filename': fileName
      }
    });
  } catch {}
}

/**
 * Candidate Resume Upload Endpoint
 * Strict file type: PDF only (.pdf extension, application/pdf MIME, and %PDF- magic bytes check).
 * Uploaded directly to project's public folder: public/resumes/
 */
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const u = await user();

    if (r.headers.get('x-hireease-upload') !== '1') {
      throw new ApiError('Upload header is required.', 403);
    }

    const contentLength = Number(r.headers.get('content-length') || 0);
    if (contentLength > 10 * 1024 * 1024 + 50000) {
      throw new ApiError('Choose a PDF file no larger than 10 MB.', 413);
    }

    const p = await db().prepare('SELECT user_id FROM profiles WHERE user_id = ?').bind(u.userId).first();
    if (!p) {
      throw new ApiError('Save your profile before uploading a résumé.', 400);
    }

    const formData = await r.formData();
    const f = formData.get('resume');

    if (!(f instanceof File) || f.size === 0) {
      throw new ApiError('Please select a valid résumé file.', 400);
    }

    if (f.size > 10 * 1024 * 1024) {
      throw new ApiError('Choose a PDF file no larger than 10 MB.', 413);
    }

    // 1. Strict extension check: Only .pdf allowed
    const fileNameLower = f.name.toLowerCase().trim();
    const ext = fileNameLower.split('.').pop();
    if (ext !== 'pdf' || !fileNameLower.endsWith('.pdf')) {
      throw new ApiError('Strict policy: Only PDF files (.pdf) are allowed as résumé.', 400);
    }

    // 2. Strict MIME type check (if provided by client)
    if (f.type && f.type !== 'application/pdf' && f.type !== 'application/x-pdf') {
      throw new ApiError('Strict policy: File MIME type must be application/pdf.', 400);
    }

    // 3. Strict Magic Bytes check: Genuine PDF must start with "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (bytes.length < 5) {
      throw new ApiError('The uploaded file is empty or corrupted.', 400);
    }

    const magic = new TextDecoder('utf-8').decode(bytes.slice(0, 5));
    if (magic !== '%PDF-') {
      throw new ApiError('Strict policy: Invalid PDF content. The file does not have a genuine %PDF- header.', 400);
    }

    // 4. Save to public/resumes within the project
    const safeUserId = u.userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueToken = crypto.randomUUID();
    const storedFileName = `resume_${safeUserId}_${uniqueToken}.pdf`;
    const publicPath = await saveResumeToPublic(storedFileName, bytes);

    const originalName = f.name.replace(/[^a-zA-Z0-9 ._()-]/g, '_').slice(0, 140);

    // 5. Clean up old resume file for this user if it was stored in public/resumes
    try {
      const prev = await db().prepare('SELECT resume_key FROM profiles WHERE user_id = ?').bind(u.userId).first<{ resume_key: string }>();
      if (prev?.resume_key && (prev.resume_key.startsWith('/resumes/') || prev.resume_key.startsWith('resumes/'))) {
        await deleteResumeFromPublic(prev.resume_key);
      }
    } catch (cleanupErr) {
      console.warn('Previous resume cleanup skipped:', cleanupErr);
    }

    // 6. Update database record
    await db().prepare(
      'UPDATE profiles SET resume_key = ?, resume_name = ?, updated_at = ? WHERE user_id = ?'
    ).bind(publicPath, originalName, new Date().toISOString(), u.userId).run();

    return json({
      resumeName: originalName,
      resumeKey: publicPath,
      resumeUrl: publicPath
    });
  } catch (e: any) {
    console.error('RESUME UPLOAD DETAILED ERROR:', e?.name, e?.message, e?.stack);
    return fail(e);
  }
}

/**
 * Candidate Resume Download & View Endpoint
 * Allows candidates to access their own resume and authorized staff to view applicant resumes.
 */
export async function GET(r: Request) {
  try {
    const u = await user();
    const params = new URL(r.url).searchParams;
    const applicationId = params.get('application');
    let p: any;

    if (applicationId) {
      const a = await db().prepare('SELECT user_id, snapshot FROM applications WHERE id = ?').bind(applicationId).first<any>();
      if (!a) throw new ApiError('Résumé not found.', 404);
      if (a.user_id !== u.userId && !await isStaff(u.userId)) {
        throw new ApiError('You cannot access this résumé.', 403);
      }
      p = JSON.parse(a.snapshot);
    } else {
      const candidate = params.get('candidate') || u.userId;
      if (candidate !== u.userId && !await isStaff(u.userId)) {
        throw new ApiError('You cannot access this résumé.', 403);
      }
      p = await db().prepare('SELECT resume_key, resume_name FROM profiles WHERE user_id = ?').bind(candidate).first<any>();
    }

    if (!p?.resume_key) {
      throw new ApiError('No résumé has been uploaded.', 404);
    }

    const downloadName = String(p.resume_name || 'candidate_resume.pdf').replace(/[^a-zA-Z0-9 ._()-]/g, '_');

    // 1. Check local public directory storage first
    const relative = p.resume_key.replace(/^\//, '');
    const localDiskPath = path.join(process.cwd(), 'public', relative);

    try {
      if (fs.existsSync(localDiskPath)) {
        const fileBytes = await fs.promises.readFile(localDiskPath);
        return new Response(fileBytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${downloadName}"`,
            'Cache-Control': 'private, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    } catch {}

    // 2. Try fetching static public file directly from dev server
    try {
      const publicUrl = p.resume_key.startsWith('/') ? p.resume_key : '/' + p.resume_key;
      const staticFetch = await fetch('http://127.0.0.1:5173' + publicUrl);
      if (staticFetch.ok) {
        const arrayBuf = await staticFetch.arrayBuffer();
        return new Response(arrayBuf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${downloadName}"`,
            'Cache-Control': 'private, max-age=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    } catch {}

    // 3. Fallback to R2 bucket if older file stored in object storage
    try {
      const object = await bucket().get(p.resume_key);
      if (object) {
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/pdf',
            'Content-Disposition': `inline; filename="${downloadName}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    } catch {}

    throw new ApiError('Résumé file not found on disk or storage.', 404);
  } catch (e) {
    return fail(e);
  }
}
