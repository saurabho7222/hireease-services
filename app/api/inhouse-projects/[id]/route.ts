import { db, staffUser, body, json, fail } from '@/lib/server';
import { projectRow } from '../route';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await staffUser();
    const { id } = await params;

    const existing = await db()
      .prepare('SELECT id, title FROM inhouse_projects WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!existing) {
      return json({ error: 'Project not found' }, 404);
    }

    await db().prepare('DELETE FROM inhouse_projects WHERE id = ?').bind(id).run();

    // Log admin audit
    try {
      await db()
        .prepare(`
          INSERT INTO admin_audit_logs (id, actor_id, actor_email, action, target_id, details, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          crypto.randomUUID(),
          admin.userId,
          admin.email,
          'DELETE_INHOUSE_PROJECT',
          id,
          `Deleted in-house project "${existing.title}"`,
          new Date().toISOString()
        )
        .run();
    } catch {}

    return json({ success: true, deletedId: id });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await staffUser();
    const { id } = await params;
    const updateData: any = await body(req);

    const now = new Date().toISOString();
    const existing = await db()
      .prepare('SELECT * FROM inhouse_projects WHERE id = ?')
      .bind(id)
      .first<any>();

    if (!existing) {
      return json({ error: 'Project not found' }, 404);
    }

    const newStatus = updateData.status || existing.status;
    const newTitle = updateData.title || existing.title;
    const newPayout = updateData.payout || existing.payout;

    await db()
      .prepare(`
        UPDATE inhouse_projects
        SET title = ?, payout = ?, status = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(newTitle, newPayout, newStatus, now, id)
      .run();

    const updated = await db()
      .prepare('SELECT * FROM inhouse_projects WHERE id = ?')
      .bind(id)
      .first<any>();

    return json({ success: true, project: projectRow(updated) });
  } catch (e) {
    return fail(e);
  }
}

