import { db, json, body, fail, ApiError } from '@/lib/server';
import {
  ensureAuthTables,
  createAndSendEmailOtp
} from '@/lib/auth-server';
import { z } from 'zod';

const resendOtpSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').toLowerCase()
});

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    const data = resendOtpSchema.parse(await body(r));
    const d = db();

    const user = await d.prepare(`
      SELECT id, email, name, email_verified
      FROM users
      WHERE email = ?
    `).bind(data.email).first<{
      id: string;
      email: string;
      name: string;
      email_verified: number;
    }>();

    if (!user) {
      throw new ApiError('No account found with this email address.', 404);
    }

    if (user.email_verified === 1) {
      return json({ success: true, alreadyVerified: true, message: 'This email is already verified. You can sign in directly.' });
    }

    await createAndSendEmailOtp(user.email, user.name, true);

    return json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email address.'
    });
  } catch (e) {
    return fail(e);
  }
}
