import { db, json, body, fail, ApiError } from '@/lib/server';
import {
  ensureAuthTables,
  verifyPassword,
  createSession,
  getSuperAdminEmail,
  createAndSendEmailOtp,
  type UserRole
} from '@/lib/auth-server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').toLowerCase(),
  password: z.string().min(1, 'Enter your password.')
});

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    const data = loginSchema.parse(await body(r));
    const d = db();

    // Query user by email from DB
    const user = await d.prepare(`
      SELECT id, email, password_hash, salt, name, role, provider, email_verified
      FROM users
      WHERE email = ?
    `).bind(data.email).first<{
      id: string;
      email: string;
      password_hash: string | null;
      salt: string | null;
      name: string;
      role: string;
      provider: string;
      email_verified: number;
    }>();

    if (!user) {
      throw new ApiError('Invalid email or password. Please try again.', 401);
    }

    if (!user.password_hash || !user.salt) {
      throw new ApiError(
        `This account is registered with ${user.provider || 'social login'}. Please sign in with that provider.`,
        400
      );
    }

    const isValid = await verifyPassword(data.password, user.salt, user.password_hash);
    if (!isValid) {
      throw new ApiError('Invalid email or password. Please try again.', 401);
    }

    // Role verification from database
    const superAdminEmail = getSuperAdminEmail();
    const isSuper = user.email.toLowerCase() === superAdminEmail;
    let userRole: UserRole = (isSuper || user.role === 'admin') ? 'admin' : 'candidate';

    // If candidate account is unverified, require OTP verification before logging in
    if (!isSuper && user.email_verified === 0) {
      await createAndSendEmailOtp(user.email, user.name, false);
      return json({
        success: true,
        requireOtp: true,
        email: user.email,
        name: user.name,
        message: 'Please verify your email address to continue. A 6-digit code has been sent to your inbox.'
      });
    }

    // If designated super admin, ensure admin role and staff ownership
    if (isSuper) {
      userRole = 'admin';
      const now = new Date().toISOString();
      await d.prepare(`
        INSERT INTO staff (id, user_id, email, created_at)
        VALUES ('owner', ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email
      `).bind(user.id, user.email, now).run();
    }

    // Create session in DB
    const { cookie } = await createSession(user.id, userRole);
    const redirectUrl = userRole === 'admin' ? '/admin' : '/dashboard';

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole
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
