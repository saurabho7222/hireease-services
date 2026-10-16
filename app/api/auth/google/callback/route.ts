import { db as getDb } from '@/lib/server';
import {
  ensureAuthTables,
  createSession,
  parseCookieHeader,
  getSuperAdminEmail,
  type UserRole
} from '@/lib/auth-server';

import { getGoogleConfig } from '@/lib/oauth-config';

export async function GET(r: Request) {
  try {
    await ensureAuthTables();
    const url = new URL(r.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const host = r.headers.get('host') || '127.0.0.1:5173';
    const proto = r.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    const origin = `${proto}://${host}`;
    const callbackUrl = `${origin}/api/auth/google/callback`;

    // Verify state cookie
    const cookieHeader = r.headers.get('cookie');
    const cookies = parseCookieHeader(cookieHeader);
    const expectedState = cookies['hireease_oauth_state'];

    if (!state || !expectedState || state !== expectedState) {
      return new Response('Invalid or expired authentication state. Please try logging in again.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const { clientId, clientSecret, isConfigured } = getGoogleConfig();

    let email = '';
    let name = '';

    if (isConfigured && !code?.startsWith('sim_')) {
      // Exchange authorization code with Google OAuth servers
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code || '',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Google token exchange error:', errText);
        return new Response('Failed to exchange authorization code with Google.', { status: 400 });
      }

      const tokenData: any = await tokenRes.json();
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!userRes.ok) {
        return new Response('Failed to retrieve user info from Google.', { status: 400 });
      }

      const profile: any = await userRes.json();
      email = profile.email || '';
      name = profile.name || email.split('@')[0];
    } else {
      // Local dev simulation flow
      email = url.searchParams.get('email') || '';
      name = url.searchParams.get('name') || email.split('@')[0] || 'Google User';
    }

    email = email.toLowerCase().trim();
    if (!email) {
      return new Response('Missing verified email address from Google authentication.', { status: 400 });
    }

    const d = getDb();
    const now = new Date().toISOString();
    const superAdminEmail = getSuperAdminEmail();
    const isSuperAdmin = email === superAdminEmail;

    // Check existing user in database
    let user = await d.prepare(`
      SELECT id, email, name, role
      FROM users
      WHERE email = ?
    `).bind(email).first<{
      id: string;
      email: string;
      name: string;
      role: string;
    }>();

    let userId: string;
    let userRole: UserRole;

    if (user) {
      userId = user.id;
      // If designated super admin, guarantee admin role
      if (isSuperAdmin) {
        userRole = 'admin';
        if (user.role !== 'admin') {
          await d.prepare(`UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?`).bind(now, userId).run();
        }
      } else {
        // Otherwise strictly adhere to database role (admin only if Super Admin approved)
        userRole = user.role === 'admin' ? 'admin' : 'candidate';
      }

      // Update name/updated_at and mark email_verified = 1
      await d.prepare(`UPDATE users SET name = ?, email_verified = 1, updated_at = ? WHERE id = ?`).bind(name || user.name, now, userId).run();
    } else {
      // New user from Google
      // Only the Super Admin email is granted admin; all other users are strictly candidates
      userRole = isSuperAdmin ? 'admin' : 'candidate';
      userId = (userRole === 'admin' ? 'usr_adm_' : 'usr_cand_') + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

      await d.prepare(`
        INSERT INTO users (id, email, name, role, provider, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'google', 1, ?, ?)
      `).bind(userId, email, name, userRole, now, now).run();

      if (userRole === 'candidate') {
        await d.prepare(`
          INSERT INTO profiles (user_id, email, name, address, city, country, education, institution, graduation_year, skills, experience, consented_at, updated_at)
          VALUES (?, ?, ?, '', '', '', '', '', '', '[]', '', ?, ?)
          ON CONFLICT(user_id) DO NOTHING
        `).bind(userId, email, name, now, now).run();
      } else {
        await d.prepare(`
          INSERT INTO staff (id, user_id, email, created_at)
          VALUES ('owner', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email
        `).bind(userId, email, now).run();
      }
    }

    // Create session
    const { cookie: sessionCookie } = await createSession(userId, userRole);

    // Clear state cookie
    const clearStateCookie = 'hireease_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';

    const targetUrl = userRole === 'admin' ? `${origin}/admin` : `${origin}/dashboard`;

    const resHeaders = new Headers();
    resHeaders.set('Location', targetUrl);
    resHeaders.set('Cache-Control', 'no-store');
    resHeaders.append('Set-Cookie', sessionCookie);
    resHeaders.append('Set-Cookie', clearStateCookie);

    return new Response(null, {
      status: 302,
      headers: resHeaders
    });
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return new Response(`Authentication error: ${err?.message || 'Internal error'}`, { status: 500 });
  }
}
