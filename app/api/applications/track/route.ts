import { db, user, body, json, fail, ApiError, publicProfile } from '@/lib/server';
import { sampleJobs } from '@/lib/jobs';
import { z } from 'zod';

const trackApplicationSchema = z.object({
  jobId: z.string().min(1).max(100),
  externalUrl: z.string().url().optional(),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(2).optional()
});

export async function POST(r: Request) {
  try {
    const d = db();
    const reqData = trackApplicationSchema.parse(await body(r));
    const now = new Date().toISOString();

    // 1. Fetch Job Information
    const sample = sampleJobs.find(j => j.id === reqData.jobId);
    const job = sample || await d.prepare('SELECT * FROM jobs WHERE id = ?').bind(reqData.jobId).first<any>();
    if (!job) {
      throw new ApiError('Job opportunity not found or closed.', 404);
    }

    const targetUrl = reqData.externalUrl || job.external_url || job.externalUrl || `https://refer.micro1.ai/referral/jobs?referralCode=a462a1ef-5825-41db-8422-83628df889fc`;
    const platform = job.company || job.platform || 'micro1';

    // 2. Resolve Candidate Identity
    let activeUserId: string | null = null;
    let candidateEmail = '';
    let candidateName = '';
    let candidateProfile: any = null;

    try {
      const u = await user();
      activeUserId = u.userId;
      candidateEmail = u.email;
      candidateName = u.fullName || u.displayName || candidateEmail.split('@')[0];
    } catch {
      // Not logged in with session
    }

    // If guest provided details, create or find guest candidate account
    if (!activeUserId && reqData.guestEmail) {
      const normEmail = reqData.guestEmail.toLowerCase().trim();
      const existingUser = await d.prepare('SELECT id, name, email FROM users WHERE email = ?').bind(normEmail).first<any>();
      if (existingUser) {
        activeUserId = existingUser.id;
        candidateEmail = existingUser.email;
        candidateName = existingUser.name;
      } else {
        activeUserId = 'usr_guest_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        candidateEmail = normEmail;
        candidateName = reqData.guestName?.trim() || normEmail.split('@')[0];
        await d.prepare(`
          INSERT INTO users (id, email, name, role, provider, email_verified, created_at, updated_at)
          VALUES (?, ?, ?, 'candidate', 'credentials', 0, ?, ?)
        `).bind(activeUserId, candidateEmail, candidateName, now, now).run();
      }
    }

    // If still not authenticated and no guest info, return state for prompt
    if (!activeUserId) {
      return json({
        success: false,
        authenticated: false,
        externalUrl: targetUrl,
        jobTitle: job.title,
        company: platform
      });
    }

    // Fetch existing profile if available
    const existingProfile = await d.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(activeUserId).first<any>();
    if (existingProfile) {
      candidateProfile = publicProfile(existingProfile);
    }

    // 3. Find or Create Application
    const existingApp = await d.prepare('SELECT * FROM applications WHERE user_id = ? AND job_id = ?')
      .bind(activeUserId, job.id)
      .first<any>();

    let applicationId = existingApp?.id;

    if (!existingApp) {
      applicationId = 'app_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const initialSnapshot = {
        name: candidateProfile?.name || candidateName,
        email: candidateProfile?.email || candidateEmail,
        city: candidateProfile?.city || '',
        country: candidateProfile?.country || '',
        skills: candidateProfile?.skills || [],
        experience: candidateProfile?.experience || '',
        resumeName: candidateProfile?.resumeName || null,
        resumeUrl: candidateProfile?.resumeUrl || null,
        platform,
        externalUrl: targetUrl,
        appliedAt: now,
        statusHistory: [
          {
            status: 'clicked_apply',
            timestamp: now,
            title: 'Clicked Apply & Redirected',
            note: `Candidate clicked Apply Now on HireEase Services and redirected to official ${platform} application link.`,
            actor: 'candidate',
            actorEmail: candidateEmail
          }
        ]
      };

      await d.prepare(`
        INSERT INTO applications (id, user_id, job_id, job_title, company, is_sample, snapshot, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, 'clicked_apply', ?, ?)
      `).bind(
        applicationId,
        activeUserId,
        job.id,
        job.title,
        platform,
        JSON.stringify(initialSnapshot),
        now,
        now
      ).run();
    } else {
      // Append redirect visit to statusHistory
      let snap: any = {};
      try {
        snap = JSON.parse(existingApp.snapshot || '{}');
      } catch {
        snap = {};
      }
      if (!Array.isArray(snap.statusHistory)) {
        snap.statusHistory = [];
      }
      snap.statusHistory.push({
        status: existingApp.status || 'clicked_apply',
        timestamp: now,
        title: 'Re-opened Job Application Link',
        note: `Candidate revisited official application page on ${platform}.`,
        actor: 'candidate',
        actorEmail: candidateEmail
      });
      snap.externalUrl = targetUrl;

      await d.prepare(`
        UPDATE applications
        SET snapshot = ?, updated_at = ?
        WHERE id = ?
      `).bind(JSON.stringify(snap), now, existingApp.id).run();
    }

    return json({
      success: true,
      recorded: true,
      authenticated: true,
      applicationId,
      jobTitle: job.title,
      company: platform,
      externalUrl: targetUrl,
      message: 'Your application has been recorded on HireEase Services. You will now be redirected to the official job application page.'
    }, 201);
  } catch (e) {
    return fail(e);
  }
}
