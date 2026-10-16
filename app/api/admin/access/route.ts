import { db, staffUser, user, body, json, fail, ApiError } from '@/lib/server';
import {
  isSuperAdminEmail,
  grantAdminRole,
  revokeAdminRole,
  submitAdminAccessRequest,
  ensureAuthTables
} from '@/lib/auth-server';
import { z } from 'zod';

export async function GET() {
  try {
    const u = await staffUser();
    await ensureAuthTables();
    const d = db();

    // Only designated Super Admin or authorized staff can view team access
    const admins = await d.prepare(`
      SELECT id, email, name, role, provider, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `).all<any>();

    const pendingRequests = await d.prepare(`
      SELECT id, user_id, email, name, reason, status, created_at
      FROM admin_access_requests
      ORDER BY created_at DESC
      LIMIT 100
    `).all<any>();

    return json({
      isSuperAdmin: isSuperAdminEmail(u.email),
      admins: admins.results,
      requests: pendingRequests.results
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(r: Request) {
  try {
    const u = await user();
    const data = z.object({
      reason: z.string().trim().min(5, 'Provide a brief reason for requesting administrator access.').max(500)
    }).parse(await body(r));

    const result = await submitAdminAccessRequest(u.userId, u.email, u.fullName || u.displayName || 'User', data.reason);
    return json({ success: true, requestId: result.id }, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(r: Request) {
  try {
    const u = await staffUser();

    // Only Super Admin can approve or revoke additional admin access
    if (!isSuperAdminEmail(u.email)) {
      throw new ApiError('Only the designated Super Admin can approve or revoke administrator privileges.', 403);
    }

    const data = z.object({
      userId: z.string().min(1),
      action: z.enum(['grant', 'revoke'])
    }).parse(await body(r));

    if (data.action === 'grant') {
      const ok = await grantAdminRole(data.userId, u.userId);
      if (!ok) throw new ApiError('User not found or could not grant admin role.', 404);
      return json({ success: true, message: 'Administrator role granted successfully.' });
    } else {
      const ok = await revokeAdminRole(data.userId, u.userId);
      if (!ok) throw new ApiError('User not found or could not revoke admin role.', 404);
      return json({ success: true, message: 'Administrator role revoked successfully.' });
    }
  } catch (e) {
    return fail(e);
  }
}
