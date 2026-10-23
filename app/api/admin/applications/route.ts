import { db, staffUser, body, json, fail, ApiError } from '@/lib/server';
import { sendCandidateApprovalEmail } from '@/lib/email-service';
import { z } from 'zod';

const updateApplicationSchema = z.object({
  id: z.string().min(1).max(100),
  status: z.enum([
    'pending',
    'submitted',
    'review',
    'under_review',
    'interview_scheduled',
    'interview',
    'interview_done',
    'approved',
    'selected',
    'hired',
    'rejected',
    'not_selected'
  ]),
  notes: z.string().max(4000).optional(),
  rating: z.number().min(0).max(5).optional(),
  sendEmail: z.boolean().optional()
});

export async function PATCH(r: Request) {
  try {
    const u = await staffUser();
    const data = updateApplicationSchema.parse(await body(r));
    const d = db();
    const now = new Date().toISOString();

    // Query application and applicant snapshot details
    const existing = await d.prepare(`
      SELECT id, user_id, job_title, company, snapshot, status
      FROM applications
      WHERE id = ?
    `).bind(data.id).first<{
      id: string;
      user_id: string;
      job_title: string;
      company: string;
      snapshot: string;
      status: string;
    }>();

    if (!existing) {
      throw new ApiError('Application not found.', 404);
    }

    // Merge notes & rating into snapshot JSON safely
    let snap: Record<string, any> = {};
    try {
      snap = JSON.parse(existing.snapshot || '{}');
    } catch {
      snap = {};
    }

    if (data.notes !== undefined) {
      snap.adminNotes = data.notes;
      snap.adminNotesUpdatedAt = now;
      snap.adminNotesUpdatedBy = u.userId;
    }
    if (data.rating !== undefined) {
      snap.adminRating = data.rating;
    }

    const updatedSnapshot = JSON.stringify(snap);

    // Update status and snapshot in database
    const result = await d.prepare(`
      UPDATE applications
      SET status = ?, snapshot = ?, updated_at = ?, updated_by = ?
      WHERE id = ?
    `).bind(data.status, updatedSnapshot, now, u.userId, data.id).run();

    if (!result.meta.changes) {
      throw new ApiError('Could not update application.', 500);
    }

    let emailSent = false;
    let recipientEmail = '';

    // If status is updated to 'selected' / 'approved' or sendEmail is requested, dispatch approval email
    const isApprovalStatus = data.status === 'selected' || data.status === 'approved';
    if (isApprovalStatus || data.sendEmail) {
      try {
        recipientEmail = snap.email;
        const recipientName = snap.name || 'Candidate';

        if (recipientEmail) {
          await sendCandidateApprovalEmail({
            candidateEmail: recipientEmail,
            candidateName: recipientName,
            jobTitle: existing.job_title,
            company: existing.company,
            applicationId: existing.id
          });
          emailSent = true;
        }
      } catch (emailErr) {
        console.error('Failed to dispatch candidate approval email:', emailErr);
      }
    }

    return json({
      updated: true,
      status: data.status,
      notes: snap.adminNotes || '',
      rating: snap.adminRating || 0,
      emailSent,
      recipientEmail
    });
  } catch (e) {
    return fail(e);
  }
}

