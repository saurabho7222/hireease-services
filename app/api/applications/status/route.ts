import { db, user, body, json, fail, ApiError } from '@/lib/server';
import { z } from 'zod';

const candidateUpdateSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum([
    'awaiting_confirmation',
    'submitted',
    'assessment',
    'interview_scheduled',
    'interview_completed'
  ]),
  interviewDate: z.string().optional(),
  note: z.string().max(1000).optional()
});

export async function PATCH(r: Request) {
  try {
    const u = await user();
    const data = candidateUpdateSchema.parse(await body(r));
    const d = db();
    const now = new Date().toISOString();

    const existing = await d.prepare(`
      SELECT id, user_id, job_title, company, snapshot, status
      FROM applications
      WHERE id = ? AND user_id = ?
    `).bind(data.applicationId, u.userId).first<any>();

    if (!existing) {
      throw new ApiError('Application record not found.', 404);
    }

    let snap: any = {};
    try {
      snap = JSON.parse(existing.snapshot || '{}');
    } catch {
      snap = {};
    }

    if (!Array.isArray(snap.statusHistory)) {
      snap.statusHistory = [];
    }

    const titles: Record<string, string> = {
      awaiting_confirmation: 'Candidate Confirmed External Submission',
      submitted: 'Application Submitted & Verified',
      assessment: 'Candidate Reported Assessment Stage',
      interview_scheduled: 'Candidate Reported Interview Scheduled',
      interview_completed: 'Candidate Reported Interview Completed'
    };

    snap.statusHistory.push({
      status: data.status,
      timestamp: now,
      title: titles[data.status] || data.status,
      note: data.note || `Candidate reported progress: ${data.status.replace(/_/g, ' ')}`,
      actor: 'candidate',
      actorEmail: u.email,
      interviewDate: data.interviewDate || snap.interviewDate || null
    });

    if (data.interviewDate) {
      snap.interviewDate = data.interviewDate;
    }

    await d.prepare(`
      UPDATE applications
      SET status = ?, snapshot = ?, updated_at = ?
      WHERE id = ?
    `).bind(data.status, JSON.stringify(snap), now, existing.id).run();

    return json({
      success: true,
      status: data.status,
      message: 'Application status updated successfully.'
    });
  } catch (e) {
    return fail(e);
  }
}

