import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db as getDb } from './server';
import { sendOtpVerificationEmail } from './email-service';

export type UserRole = 'admin' | 'candidate';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'credentials' | 'google' | 'linkedin';
  createdAt: string;
};

export function getSuperAdminEmail(): string {
  return (process.env.SUPER_ADMIN_EMAIL || 'admin@hireease.com').toLowerCase().trim();
}

export const DESIGNATED_ADMIN_DEFAULT_PASSWORD = 'Admin@12345';

export const DEMO_CANDIDATE_EMAIL = 'candidate@hireease.com';
export const DEMO_CANDIDATE_DEFAULT_PASSWORD = 'Candidate@12345';

const SESSION_COOKIE_NAME = 'hireease_session';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * PBKDF2 Password Hashing using WebCrypto API
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  const hashArray = Array.from(new Uint8Array(bits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password, salt);
  return computed === storedHash;
}

let tablesInitialized = false;

/**
 * Initialize Tables & Seed Designated Super Admin & Candidate Starter
 */
export async function ensureAuthTables(): Promise<void> {
  if (tablesInitialized) return;
  const d = getDb();
  try {
    await d.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT, salt TEXT, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'candidate', provider TEXT NOT NULL DEFAULT 'credentials', email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
    await d.prepare(`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    await d.prepare(`CREATE TABLE IF NOT EXISTS outbox_emails (id TEXT PRIMARY KEY NOT NULL, recipient_email TEXT NOT NULL, recipient_name TEXT, subject TEXT NOT NULL, text_content TEXT, html_content TEXT, status TEXT NOT NULL DEFAULT 'sent', sent_at TEXT NOT NULL)`).run();
    await d.prepare(`CREATE TABLE IF NOT EXISTS admin_access_requests (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT)`).run();
    await d.prepare(`CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, otp TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    await d.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`).run();
    await d.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)`).run();
    await d.prepare(`CREATE INDEX IF NOT EXISTS idx_verifications_email ON email_verifications (email)`).run();

    // Ensure email_verified column exists in case users table already existed
    try {
      await d.prepare(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`).run();
    } catch {}
  } catch (e) {
    console.warn('Table initialization warning:', e);
  }

  const superAdminEmail = getSuperAdminEmail();

  // Seed Designated Super Admin if not exists
  const existingAdmin = await d.prepare('SELECT id, role FROM users WHERE email = ?').bind(superAdminEmail).first<{ id: string; role: string }>();
  if (!existingAdmin) {
    const adminSalt = generateSalt();
    const adminHash = await hashPassword(DESIGNATED_ADMIN_DEFAULT_PASSWORD, adminSalt);
    const now = new Date().toISOString();
    const adminId = 'usr_admin_' + Math.random().toString(36).slice(2, 10);

    await d.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, role, provider, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'credentials', 1, ?, ?)
    `).bind(adminId, superAdminEmail, adminHash, adminSalt, 'HireEase Super Admin', now, now).run();

    // Ensure admin is registered as staff owner
    await d.prepare(`
      INSERT INTO staff (id, user_id, email, created_at)
      VALUES ('owner', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email
    `).bind(adminId, superAdminEmail, now).run();
  } else {
    // Ensure existing designated super admin account has admin role and is verified
    await d.prepare(`UPDATE users SET role = 'admin', email_verified = 1 WHERE id = ?`).bind(existingAdmin.id).run();
  }

  // Seed Demo Candidate if not exists
  const existingCandidate = await d.prepare('SELECT id FROM users WHERE email = ?').bind(DEMO_CANDIDATE_EMAIL).first<{ id: string }>();
  if (!existingCandidate) {
    const candSalt = generateSalt();
    const candHash = await hashPassword(DEMO_CANDIDATE_DEFAULT_PASSWORD, candSalt);
    const now = new Date().toISOString();
    const candId = 'usr_cand_' + Math.random().toString(36).slice(2, 10);

    await d.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, role, provider, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'candidate', 'credentials', 1, ?, ?)
    `).bind(candId, DEMO_CANDIDATE_EMAIL, candHash, candSalt, 'Alex Rivera', now, now).run();

    // Ensure candidate has a starter profile
    await d.prepare(`
      INSERT INTO profiles (user_id, email, name, address, city, country, education, institution, graduation_year, skills, experience, consented_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).bind(
      candId,
      DEMO_CANDIDATE_EMAIL,
      'Alex Rivera',
      '42 Tech Park, Outer Ring Road',
      'Bengaluru',
      'India',
      'B.Tech in Artificial Intelligence',
      'National Institute of Technology',
      '2024',
      JSON.stringify(['Python', 'PyTorch', 'Prompt Engineering', 'Data Evaluation']),
      'Experienced in evaluating large language model responses and developing AI workflow pipelines.',
      now,
      now
    ).run();
  } else {
    // Ensure demo candidate account is marked verified
    await d.prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).bind(existingCandidate.id).run();
  }
  tablesInitialized = true;
}

/**
 * Cookie parsing helper
 */
export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      cookies[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return cookies;
}

export function buildSessionCookie(sessionId: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Create a new DB-backed session
 */
export async function createSession(userId: string, role: UserRole): Promise<{ sessionId: string; cookie: string }> {
  await ensureAuthTables();
  const d = getDb();
  const sessionId = 'ses_' + crypto.randomUUID().replace(/-/g, '');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await d.prepare(`
    INSERT INTO sessions (id, user_id, role, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(sessionId, userId, role, expiresAt, now.toISOString()).run();

  return {
    sessionId,
    cookie: buildSessionCookie(sessionId)
  };
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const d = getDb();
    await d.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  } catch {}
}

/**
 * Get currently authenticated user from DB
 */
export async function getAuthUser(): Promise<AppUser | null> {
  try {
    await ensureAuthTables();
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get('cookie');
    const cookies = parseCookieHeader(cookieHeader);
    const sessionId = cookies[SESSION_COOKIE_NAME];

    if (!sessionId) return null;

    const d = getDb();
    const now = new Date().toISOString();

    const record = await d.prepare(`
      SELECT s.id as session_id, s.role as session_role, s.expires_at,
             u.id as user_id, u.email, u.name, u.role as user_role, u.provider, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > ?
    `).bind(sessionId, now).first<{
      session_id: string;
      session_role: string;
      expires_at: string;
      user_id: string;
      email: string;
      name: string;
      user_role: string;
      provider: 'credentials' | 'google' | 'linkedin';
      created_at: string;
    }>();

    if (!record) return null;

    // Database and super admin config are sources of truth for role
    const isSuper = record.email.toLowerCase() === getSuperAdminEmail();
    const finalRole: UserRole = (isSuper || record.user_role === 'admin') ? 'admin' : 'candidate';

    return {
      id: record.user_id,
      email: record.email,
      name: record.name,
      role: finalRole,
      provider: record.provider || 'credentials',
      createdAt: record.created_at
    };
  } catch (e) {
    console.error('getAuthUser error', e);
    return null;
  }
}

/**
 * Require authenticated user for Server Components
 */
export async function requireAuthUser(options: {
  returnTo?: string;
  requiredRole?: UserRole;
} = {}): Promise<AppUser> {
  const user = await getAuthUser();

  if (!user) {
    const returnTo = options.returnTo || '/dashboard';
    redirect(`/auth?return_to=${encodeURIComponent(returnTo)}`);
  }

  if (options.requiredRole === 'admin' && user.role !== 'admin') {
    // Candidates trying to access admin panel are redirected to candidate dashboard
    redirect('/dashboard');
  }

  return user;
}

export function isSuperAdminEmail(email: string): boolean {
  return email.toLowerCase().trim() === getSuperAdminEmail();
}

/**
 * Submit an admin access request (requires super admin approval)
 */
export async function submitAdminAccessRequest(userId: string, email: string, name: string, reason: string): Promise<{ id: string }> {
  await ensureAuthTables();
  const d = getDb();
  const id = 'req_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const now = new Date().toISOString();

  await d.prepare(`
    INSERT INTO admin_access_requests (id, user_id, email, name, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).bind(id, userId, email, name, reason, now).run();

  return { id };
}

/**
 * Super Admin grants admin role to a user
 */
export async function grantAdminRole(userId: string, approvedBy: string): Promise<boolean> {
  await ensureAuthTables();
  const d = getDb();
  const now = new Date().toISOString();

  // Update user role to admin
  const userRes = await d.prepare(`
    UPDATE users SET role = 'admin', updated_at = ?
    WHERE id = ?
  `).bind(now, userId).run();

  if (!userRes.meta.changes) return false;

  // Update session role if active
  await d.prepare(`
    UPDATE sessions SET role = 'admin'
    WHERE user_id = ?
  `).bind(userId).run();

  // Mark pending requests as approved
  await d.prepare(`
    UPDATE admin_access_requests
    SET status = 'approved', reviewed_at = ?, reviewed_by = ?
    WHERE user_id = ? AND status = 'pending'
  `).bind(now, approvedBy, userId).run();

  return true;
}

/**
 * Super Admin revokes admin role from a user
 */
export async function revokeAdminRole(userId: string, revokedBy: string): Promise<boolean> {
  await ensureAuthTables();
  const d = getDb();
  const now = new Date().toISOString();

  // Find user email to protect Super Admin from accidental self-revocation
  const target = await d.prepare(`SELECT email FROM users WHERE id = ?`).bind(userId).first<{ email: string }>();
  if (target && isSuperAdminEmail(target.email)) {
    throw new Error('Cannot revoke access from the designated Super Admin account.');
  }

  const userRes = await d.prepare(`
    UPDATE users SET role = 'candidate', updated_at = ?
    WHERE id = ?
  `).bind(now, userId).run();

  if (!userRes.meta.changes) return false;

  // Demote active sessions
  await d.prepare(`
    UPDATE sessions SET role = 'candidate'
    WHERE user_id = ?
  `).bind(userId).run();

  // Mark requests as rejected/revoked
  await d.prepare(`
    UPDATE admin_access_requests
    SET status = 'rejected', reviewed_at = ?, reviewed_by = ?
    WHERE user_id = ? AND status = 'pending'
  `).bind(now, revokedBy, userId).run();

  return true;
}

/**
 * Generate 6-digit random verification code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates, saves, and dispatches an OTP verification code
 * If forceNew is false and an unexpired OTP exists, re-sends that OTP instead of invalidating it.
 */
export async function createAndSendEmailOtp(email: string, name: string, forceNew = false): Promise<string> {
  await ensureAuthTables();
  const d = getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  // If forceNew is false, check if an unexpired OTP already exists for this email
  if (!forceNew) {
    const existing = await d.prepare(`
      SELECT otp, expires_at
      FROM email_verifications
      WHERE email = ? AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(normalizedEmail, now.toISOString()).first<{ otp: string; expires_at: string }>();

    if (existing) {
      // Re-dispatch existing valid OTP so user doesn't have mismatched codes
      await sendOtpVerificationEmail({
        candidateEmail: normalizedEmail,
        candidateName: name || normalizedEmail.split('@')[0],
        otp: existing.otp
      });
      return existing.otp;
    }
  }

  const otp = generateOtp();
  const id = 'otp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 mins

  // Invalidate previous OTPs for this email
  await d.prepare('DELETE FROM email_verifications WHERE email = ?').bind(normalizedEmail).run();

  // Save new OTP
  await d.prepare(`
    INSERT INTO email_verifications (id, email, otp, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, normalizedEmail, otp, expiresAt, now.toISOString()).run();

  // Dispatch email
  await sendOtpVerificationEmail({
    candidateEmail: normalizedEmail,
    candidateName: name || normalizedEmail.split('@')[0],
    otp
  });

  return otp;
}

/**
 * Verifies the 6-digit email OTP
 */
export async function verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  await ensureAuthTables();
  const d = getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date().toISOString();

  const record = await d.prepare(`
    SELECT id, otp, expires_at
    FROM email_verifications
    WHERE email = ? AND otp = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(normalizedEmail, otp.trim()).first<{ id: string; otp: string; expires_at: string }>();

  if (!record) {
    return { success: false, error: 'Invalid verification code. Please check and try again.' };
  }

  if (record.expires_at < now) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // Remove verified OTP
  await d.prepare('DELETE FROM email_verifications WHERE email = ?').bind(normalizedEmail).run();

  // Mark user verified
  await d.prepare('UPDATE users SET email_verified = 1 WHERE email = ?').bind(normalizedEmail).run();

  return { success: true };
}
