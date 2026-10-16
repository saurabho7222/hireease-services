import { db, json, body, fail, ApiError } from '@/lib/server';
import {
  ensureAuthTables,
  hashPassword,
  generateSalt,
  createAndSendEmailOtp,
  getSuperAdminEmail
} from '@/lib/auth-server';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name (at least 2 characters).').max(100),
  email: z.string().trim().email('Enter a valid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100)
});

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    const data = signupSchema.parse(await body(r));
    const d = db();
    const now = new Date().toISOString();

    // Check if user already exists
    const existing = await d.prepare('SELECT id, email_verified, role FROM users WHERE email = ?').bind(data.email).first<{
      id: string;
      email_verified: number;
      role: string;
    }>();

    if (existing && existing.email_verified === 1) {
      throw new ApiError('An account with this email already exists. Please sign in instead.', 409);
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);

    let userId: string;

    if (existing) {
      // User registered previously but did not complete email verification: update credentials
      userId = existing.id;
      await d.prepare(`
        UPDATE users
        SET name = ?, password_hash = ?, salt = ?, updated_at = ?
        WHERE id = ?
      `).bind(data.name, passwordHash, salt, now, userId).run();
    } else {
      // New candidate account - always strictly assigned role 'candidate'
      userId = 'usr_cand_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      await d.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, provider, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'candidate', 'credentials', 0, ?, ?)
      `).bind(userId, data.email, passwordHash, salt, data.name, now, now).run();
    }

    // Generate and send 6-digit OTP verification email
    const otp = await createAndSendEmailOtp(data.email, data.name, true);

    return new Response(JSON.stringify({
      success: true,
      requireOtp: true,
      email: data.email,
      name: data.name,
      message: 'A 6-digit verification code has been sent to your email.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return fail(e);
  }
}
