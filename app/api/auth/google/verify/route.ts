import { db as getDb, json } from '@/lib/server';
import {
  ensureAuthTables,
  createSession,
  getSuperAdminEmail,
  type UserRole
} from '@/lib/auth-server';
import { verifyGoogleIdToken } from '@/lib/oauth-config';

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    let body: any;
    try {
      body = await r.json();
    } catch {
      return json({ error: 'Invalid JSON request body.' }, 400);
    }

    const { credential } = body || {};
    if (!credential) {
      return json({ error: 'Missing Google credential token.' }, 400);
    }

    // Verify Google ID Token with Google's servers
    const googleProfile = await verifyGoogleIdToken(credential);
    const email = googleProfile.email;
    const name = googleProfile.name || email.split('@')[0];

    const d = getDb();
    const now = new Date().toISOString();
    const superAdminEmail = getSuperAdminEmail();
    const isSuperAdmin = email === superAdminEmail;

    // Check existing user
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

      await d.prepare(`
        UPDATE users
        SET name = ?, email_verified = 1, updated_at = ?
        WHERE id = ?
      `).bind(name || user.name, now, userId).run();
    } else {
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

    const { cookie: sessionCookie } = await createSession(userId, userRole);
    const redirectUrl = userRole === 'admin' ? '/admin' : '/dashboard';

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role: userRole,
        provider: 'google'
      },
      redirectUrl
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    console.error('Google token verification error:', err);
    return json({ error: err.message || 'Google authentication failed.' }, 400);
  }
}
