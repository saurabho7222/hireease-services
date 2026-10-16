import { db, json, body, fail, ApiError } from '@/lib/server';
import {
  ensureAuthTables,
  verifyEmailOtp,
  createSession,
  getSuperAdminEmail,
  type UserRole
} from '@/lib/auth-server';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').toLowerCase(),
  otp: z.string().trim().min(6, 'Enter the 6-digit code.').max(6, 'Enter the 6-digit code.')
});

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    const data = verifyOtpSchema.parse(await body(r));
    const d = db();
    const now = new Date().toISOString();

    const verificationResult = await verifyEmailOtp(data.email, data.otp);
    if (!verificationResult.success) {
      throw new ApiError(verificationResult.error || 'Invalid or expired verification code.', 400);
    }

    // Retrieve verified user
    const user = await d.prepare(`
      SELECT id, email, name, role
      FROM users
      WHERE email = ?
    `).bind(data.email).first<{
      id: string;
      email: string;
      name: string;
      role: string;
    }>();

    if (!user) {
      throw new ApiError('User account not found.', 404);
    }

    const isSuper = user.email === getSuperAdminEmail();
    const finalRole: UserRole = isSuper ? 'admin' : (user.role === 'admin' ? 'admin' : 'candidate');

    // Create starter profile for candidates
    if (finalRole === 'candidate') {
      await d.prepare(`
        INSERT INTO profiles (user_id, email, name, address, city, country, education, institution, graduation_year, skills, experience, consented_at, updated_at)
        VALUES (?, ?, ?, '', '', '', '', '', '', '[]', '', ?, ?)
        ON CONFLICT(user_id) DO NOTHING
      `).bind(user.id, user.email, user.name, now, now).run();
    }

    // Create active session in DB
    const { cookie } = await createSession(user.id, finalRole);
    const redirectUrl = finalRole === 'admin' ? '/admin' : '/dashboard';

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: finalRole
      },
      redirectUrl
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return fail(e);
  }
}
