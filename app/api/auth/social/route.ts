import { db, json, body, fail, ApiError } from '@/lib/server';
import {
  ensureAuthTables,
  createSession,
  getSuperAdminEmail,
  type UserRole
} from '@/lib/auth-server';
import { z } from 'zod';

const socialAuthSchema = z.object({
  provider: z.enum(['google', 'linkedin']),
  email: z.string().trim().email('Enter a valid email address.').toLowerCase(),
  name: z.string().trim().max(100).optional()
});

export async function POST(r: Request) {
  try {
    await ensureAuthTables();
    const data = socialAuthSchema.parse(await body(r));
    const d = db();
    const now = new Date().toISOString();
    const superAdminEmail = getSuperAdminEmail();
    const isSuper = data.email === superAdminEmail;

    // Check if user already exists
    let user = await d.prepare(`
      SELECT id, email, name, role, provider
      FROM users
      WHERE email = ?
    `).bind(data.email).first<{
      id: string;
      email: string;
      name: string;
      role: string;
      provider: string;
    }>();

    let userRole: UserRole = 'candidate';
    let userId: string;
    let userName = data.name || (data.email.split('@')[0] || 'User');

    if (user) {
      userId = user.id;
      userName = user.name || userName;
      userRole = (isSuper || user.role === 'admin') ? 'admin' : 'candidate';
    } else {
      // New user registration via social auth
      userRole = isSuper ? 'admin' : 'candidate';
      userId = (userRole === 'admin' ? 'usr_adm_' : 'usr_cand_') + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

      await d.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, provider, created_at, updated_at)
        VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?)
      `).bind(userId, data.email, userName, userRole, data.provider, now, now).run();

      if (userRole === 'admin') {
        await d.prepare(`
          INSERT INTO staff (id, user_id, email, created_at)
          VALUES ('owner', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email
        `).bind(userId, data.email, now).run();
      } else {
        await d.prepare(`
          INSERT INTO profiles (user_id, email, name, address, city, country, education, institution, graduation_year, skills, experience, consented_at, updated_at)
          VALUES (?, ?, ?, '', '', '', '', '', '', '[]', '', ?, ?)
          ON CONFLICT(user_id) DO NOTHING
        `).bind(userId, data.email, userName, now, now).run();
      }
    }

    if (userRole === 'admin') {
      await d.prepare(`
        INSERT INTO staff (id, user_id, email, created_at)
        VALUES ('owner', ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, email = excluded.email
      `).bind(userId, data.email, now).run();
    }

    // Create session in DB
    const { sessionId, cookie } = await createSession(userId, userRole);
    const redirectUrl = userRole === 'admin' ? '/admin' : '/dashboard';

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: data.email,
        name: userName,
        role: userRole,
        provider: data.provider
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
