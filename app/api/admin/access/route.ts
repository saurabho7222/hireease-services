import { db, staffUser, user, body, json, fail, ApiError } from '@/lib/server';
import {
  isSuperAdminEmail,
  grantAdminRole,
  revokeAdminRole,
  inviteOrAddAdmin,
  getAdminAuditLogs,
  submitAdminAccessRequest,
  ensureAuthTables
} from '@/lib/auth-server';
import { z } from 'zod';

export async function GET() {
  try {
    const u = await staffUser();
    await ensureAuthTables();
    const d = db();

    // Query active administrators and recruiters
    const admins = await d.prepare(`
      SELECT id, email, name, role, provider, created_at, updated_at
      FROM users
      WHERE role IN ('admin', 'recruiter')
      ORDER BY role ASC, created_at ASC
    `).all<any>();

    const pendingRequests = await d.prepare(`
      SELECT id, user_id, email, name, reason, status, created_at
      FROM admin_access_requests
      ORDER BY created_at DESC
      LIMIT 100
    `).all<any>();

    const auditLogs = await getAdminAuditLogs(50);

    return json({
      isSuperAdmin: isSuperAdminEmail(u.email),
      admins: admins.results,
      requests: pendingRequests.results,
      auditLogs
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(r: Request) {
  try {
    const reqBody = await body(r);

    // Case 1: Super Admin directly adding or inviting an admin/recruiter
    if (reqBody.action === 'add_admin') {
      const u = await staffUser();
      if (!isSuperAdminEmail(u.email)) {
        throw new ApiError('Only the designated Super Admin can add new administrators.', 403);
      }

      const params = z.object({
        email: z.string().email('Please enter a valid email address.').toLowerCase().trim(),
        name: z.string().min(2, 'Name must be at least 2 characters.').trim(),
        role: z.enum(['admin', 'recruiter']).default('admin'),
        temporaryPassword: z.string().min(6).optional()
      }).parse(reqBody);

      const res = await inviteOrAddAdmin(u.userId, u.email, params);
      return json({
        success: true,
        message: `${params.role === 'recruiter' ? 'Recruiter' : 'Administrator'} account successfully created.`,
        user: res.user,
        temporaryPassword: res.temporaryPassword
      }, 201);
    }

    // Case 2: Candidate / User requesting administrative access
    const u = await user();
    const data = z.object({
      reason: z.string().trim().min(5, 'Provide a brief reason for requesting administrator access.').max(500)
    }).parse(reqBody);

    const result = await submitAdminAccessRequest(u.userId, u.email, u.fullName || u.displayName || 'User', data.reason);
    return json({ success: true, requestId: result.id }, 201);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(r: Request) {
  try {
    const u = await staffUser();

    // Only Super Admin can approve, revoke, or change administrator privileges
    if (!isSuperAdminEmail(u.email)) {
      throw new ApiError('Only the designated Super Admin can manage administrator privileges.', 403);
    }

    const data = z.object({
      userId: z.string().min(1),
      action: z.enum(['grant', 'revoke', 'change_role']),
      role: z.enum(['admin', 'recruiter']).optional()
    }).parse(await body(r));

    if (data.action === 'grant') {
      const ok = await grantAdminRole(data.userId, u.userId, data.role || 'admin');
      if (!ok) throw new ApiError('User not found or could not grant admin role.', 404);
      return json({ success: true, message: 'Administrator role granted successfully.' });
    } else if (data.action === 'change_role') {
      const targetRole = data.role || 'admin';
      const d = db();
      const now = new Date().toISOString();
      await d.prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`).bind(targetRole, now, data.userId).run();
      await d.prepare(`UPDATE sessions SET role = ? WHERE user_id = ?`).bind(targetRole, data.userId).run();
      return json({ success: true, message: `Role changed to ${targetRole}.` });
    } else {
      const ok = await revokeAdminRole(data.userId, u.userId);
      if (!ok) throw new ApiError('User not found or could not revoke admin role.', 404);
      return json({ success: true, message: 'Administrator role revoked successfully.' });
    }
  } catch (e) {
    return fail(e);
  }
}
