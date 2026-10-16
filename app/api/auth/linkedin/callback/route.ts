import { db as getDb } from '@/lib/server';
import {
  ensureAuthTables,
  createSession,
  parseCookieHeader,
  getSuperAdminEmail,
  type UserRole
} from '@/lib/auth-server';

export async function GET(r: Request) {
  try {
    await ensureAuthTables();
    const url = new URL(r.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const host = r.headers.get('host') || '127.0.0.1:5173';
    const proto = r.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    const origin = `${proto}://${host}`;
    const callbackUrl = `${origin}/api/auth/linkedin/callback`;

    // Verify state cookie
    const cookieHeader = r.headers.get('cookie');
    const cookies = parseCookieHeader(cookieHeader);
    const expectedState = cookies['hireease_linkedin_state'];

    if (!state || !expectedState || state !== expectedState) {
      return new Response('Invalid or expired LinkedIn authentication state. Please try logging in again.', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const clientId = typeof process !== 'undefined' ? process.env?.LINKEDIN_CLIENT_ID : undefined;
    const clientSecret = typeof process !== 'undefined' ? process.env?.LINKEDIN_CLIENT_SECRET : undefined;

    let email = '';
    let name = '';

    if (clientId && clientSecret && !code?.startsWith('sim_')) {
      // Exchange code for token with LinkedIn OAuth servers
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code || '',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl
        })
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('LinkedIn token exchange error:', errText);
        return new Response('Failed to exchange authorization code with LinkedIn.', { status: 400 });
      }

      const tokenData: any = await tokenRes.json();
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!userRes.ok) {
        return new Response('Failed to retrieve user profile from LinkedIn.', { status: 400 });
      }

      const profile: any = await userRes.json();
      email = profile.email || '';
      name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || email.split('@')[0];
    } else {
      // Local dev simulation flow
      email = url.searchParams.get('email') || '';
      name = url.searchParams.get('name') || email.split('@')[0] || 'LinkedIn Candidate';
    }

    email = email.toLowerCase().trim();
    if (!email) {
      return new Response('Missing verified email address from LinkedIn authentication.', { status: 400 });
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
      if (isSuperAdmin) {
        userRole = 'admin';
        if (user.role !== 'admin') {
          await d.prepare(`UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?`).bind(now, userId).run();
        }
      } else {
        userRole = user.role === 'admin' ? 'admin' : 'candidate';
      }

      // Mark email verified directly since verified by LinkedIn OAuth
      await d.prepare(`UPDATE users SET name = ?, email_verified = 1, updated_at = ? WHERE id = ?`).bind(name || user.name, now, userId).run();
    } else {
      // New user from LinkedIn OAuth is automatically a candidate (unless Super Admin)
      userRole = isSuperAdmin ? 'admin' : 'candidate';
      userId = (userRole === 'admin' ? 'usr_adm_' : 'usr_cand_') + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

      await d.prepare(`
        INSERT INTO users (id, email, name, role, provider, email_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'linkedin', 1, ?, ?)
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

    // Create session (no OTP required for OAuth)
    const { cookie: sessionCookie } = await createSession(userId, userRole);
    const clearStateCookie = 'hireease_linkedin_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';

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
    console.error('LinkedIn OAuth callback error:', err);
    return new Response(`Authentication error: ${err?.message || 'Internal error'}`, { status: 500 });
  }
}
