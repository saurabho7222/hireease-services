import { db, staffUser, body, json, fail, ApiError } from '@/lib/server';
import { sendCandidateApprovalEmail } from '@/lib/email-service';
import { z } from 'zod';

const updateApplicationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['submitted', 'review', 'interview', 'selected', 'not_selected']),
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

    // Update status in SQLite
    const result = await d.prepare(`
      UPDATE applications
      SET status = ?, updated_at = ?, updated_by = ?
      WHERE id = ?
    `).bind(data.status, now, u.userId, data.id).run();

    if (!result.meta.changes) {
      throw new ApiError('Could not update application.', 500);
    }

    let emailSent = false;
    let recipientEmail = '';

    // If status is updated to 'selected' (approved) or sendEmail is requested, dispatch approval email
    if (data.status === 'selected' || data.sendEmail) {
      try {
        const candidateProfile = JSON.parse(existing.snapshot || '{}');
        recipientEmail = candidateProfile.email;
        const recipientName = candidateProfile.name || 'Candidate';

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
      emailSent,
      recipientEmail
    });
  } catch (e) {
    return fail(e);
  }
}
