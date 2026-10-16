import { db as getDb } from './server';

export interface SendApprovalEmailOptions {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  applicationId: string;
}

export interface SendOtpEmailOptions {
  candidateEmail: string;
  candidateName: string;
  otp: string;
}

export interface EmailResult {
  success: boolean;
  emailId: string;
  recipient: string;
  provider: 'resend' | 'outbox';
  error?: string;
}

/**
 * Generate branded HireEase candidate selection email HTML
 */
export function buildApprovalEmailHtml({
  candidateName,
  jobTitle,
  company,
  applicationId
}: {
  candidateName: string;
  jobTitle: string;
  company: string;
  applicationId: string;
}): string {
  const currentYear = new Date().getFullYear();
  const refCode = applicationId.slice(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Application has been Approved</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 14px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 4px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Application Approved
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Congratulations, ${candidateName}!
        </h2>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          We are pleased to inform you that your application for the position of
          <strong style="color: #38bdf8;">${jobTitle}</strong> at
          <strong style="color: #ffffff;">${company}</strong> has been reviewed and officially <strong style="color: #4ade80;">APPROVED</strong> by our recruitment leadership team.
        </p>

        <!-- Role Highlights Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1a2744; border-radius: 10px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">
                APPLICATION DETAILS
              </p>
              <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                ${jobTitle}
              </p>
              <p style="margin: 0; font-size: 14px; color: #38bdf8;">
                ${company} · Ref #${refCode}
              </p>
            </td>
          </tr>
        </table>

        <!-- Next Steps -->
        <div style="background-color: rgba(56, 189, 248, 0.05); border-left: 4px solid #38bdf8; border-radius: 4px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">
            What Happens Next:
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            <li>Our partner recruiter will contact you within <strong>24–48 hours</strong> to coordinate your upcoming interview schedule.</li>
            <li>Keep your contact details and availability up to date on your profile.</li>
            <li>You can review this application anytime in your candidate space.</li>
          </ul>
        </div>

        <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
          <tr>
            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);">
              <a href="http://localhost:5173/dashboard" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                View Candidate Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">
          © ${currentYear} HireEase Services. Human talent · AI possibilities.
        </p>
        <p style="margin: 0;">
          This message was sent automatically regarding your application ref #${refCode}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatches candidate approval email and logs to SQLite outbox
 */
export async function sendCandidateApprovalEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  company,
  applicationId
}: SendApprovalEmailOptions): Promise<EmailResult> {
  const d = getDb();
  const emailId = 'eml_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const subject = `🎉 Congratulations! Your application for ${jobTitle} at ${company} has been approved`;
  const htmlContent = buildApprovalEmailHtml({
    candidateName,
    jobTitle,
    company,
    applicationId
  });
  const textContent = `Congratulations ${candidateName}!\n\nYour application for ${jobTitle} at ${company} has been approved by the HireEase Recruitment Team.\n\nNext Steps:\nOur talent recruiter will reach out within 24-48 hours with interview coordinates.\n\nTrack your progress at: http://localhost:5173/dashboard\n\nRef: #${applicationId.slice(0, 8).toUpperCase()}\n\nHireEase Services`;

  const now = new Date().toISOString();
  const resendApiKey = typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : undefined;

  let provider: 'resend' | 'outbox' = 'outbox';
  let deliveryStatus = 'sent';
  let errorMsg: string | undefined;

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'HireEase Services <onboarding@resend.dev>',
          to: [candidateEmail],
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      if (res.ok) {
        provider = 'resend';
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Resend API notice:', errJson);
        deliveryStatus = 'logged_outbox';
      }
    } catch (err: any) {
      console.warn('Resend delivery exception:', err?.message);
      deliveryStatus = 'logged_outbox';
      errorMsg = err?.message;
    }
  }

  try {
    await d.prepare(`
      INSERT INTO outbox_emails (id, recipient_email, recipient_name, subject, text_content, html_content, status, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailId,
      candidateEmail,
      candidateName,
      subject,
      textContent,
      htmlContent,
      deliveryStatus,
      now
    ).run();
  } catch (err) {
    console.warn('Could not persist outbox_emails record:', err);
  }

  console.log(`[HireEase Email] Dispatched candidate approval email to ${candidateEmail} for role "${jobTitle}" at "${company}". Status: ${deliveryStatus}`);

  return {
    success: true,
    emailId,
    recipient: candidateEmail,
    provider,
    error: errorMsg
  };
}

/**
 * Generate branded HireEase OTP email HTML
 */
export function buildOtpEmailHtml({
  candidateName,
  otp
}: {
  candidateName: string;
  otp: string;
}): string {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate Verification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Verify Your Candidate Account
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>${candidateName}</strong>,<br/>
          Welcome to HireEase Services! Please use the 6-digit verification code below to verify your email and activate your candidate profile:
        </p>

        <!-- OTP Code Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">
                VERIFICATION CODE
              </div>
              <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 4px 0;">
                ${otp}
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Valid for 15 minutes · Do not share with anyone
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
          If you did not initiate this candidate registration, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        © ${currentYear} HireEase Services · Human talent. AI possibilities.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatches 6-digit email OTP verification code to candidate
 */
export async function sendOtpVerificationEmail({
  candidateEmail,
  candidateName,
  otp
}: SendOtpEmailOptions): Promise<EmailResult> {
  const d = getDb();
  const emailId = 'eml_otp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14);
  const subject = `Your HireEase Verification Code: ${otp}`;
  const htmlContent = buildOtpEmailHtml({ candidateName, otp });
  const textContent = `Hello ${candidateName},\n\nYour HireEase verification code is: ${otp}\n\nThis code expires in 15 minutes. Enter this code to verify your candidate account.\n\nHireEase Services`;
  const now = new Date().toISOString();

  const resendApiKey = typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : undefined;
  let provider: 'resend' | 'outbox' = 'outbox';
  let deliveryStatus = 'sent';
  let errorMsg: string | undefined;

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'HireEase Services <onboarding@resend.dev>',
          to: [candidateEmail],
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      if (res.ok) {
        provider = 'resend';
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Resend API notice for OTP:', errJson);
        deliveryStatus = 'logged_outbox';
      }
    } catch (err: any) {
      deliveryStatus = 'logged_outbox';
      errorMsg = err?.message;
    }
  }

  try {
    await d.prepare(`
      INSERT INTO outbox_emails (id, recipient_email, recipient_name, subject, text_content, html_content, status, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailId,
      candidateEmail,
      candidateName,
      subject,
      textContent,
      htmlContent,
      deliveryStatus,
      now
    ).run();
  } catch (err) {
    console.warn('Could not persist OTP email into outbox_emails:', err);
  }

  console.log(`[HireEase OTP] Verification code for ${candidateEmail}: [ ${otp} ] (Status: ${deliveryStatus})`);

  return {
    success: true,
    emailId,
    recipient: candidateEmail,
    provider,
    error: errorMsg
  };
}
