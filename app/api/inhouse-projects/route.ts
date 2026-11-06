import { db, staffUser, body, json, fail, parseSafeJsonArray } from '@/lib/server';
import { z } from 'zod';

export function projectRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    client: r.client,
    domain: r.domain,
    payout: r.payout,
    estimatedHours: r.estimated_hours,
    duration: r.duration,
    status: r.status,
    requiredSkills: parseSafeJsonArray(r.required_skills),
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by
  };
}

const createProjectSchema = z.object({
  title: z.string().trim().min(3, 'Project title is required').max(200),
  client: z.string().trim().min(2, 'Client name is required').max(120),
  domain: z.string().trim().min(2, 'Domain category is required').max(100),
  payout: z.string().trim().min(2, 'Hourly payout rate is required').max(100),
  estimatedHours: z.string().trim().min(2, 'Estimated weekly hours is required').max(100),
  duration: z.string().trim().min(2, 'Project duration is required').max(100),
  requiredSkills: z.array(z.string().trim()).min(1, 'Provide at least one required skill'),
  description: z.string().trim().min(10, 'Provide a comprehensive project description').max(10000)
});

export async function GET() {
  try {
    const rows = await db()
      .prepare('SELECT * FROM inhouse_projects WHERE status = ? ORDER BY created_at DESC')
      .bind('open')
      .all<any>();
    return json({ projects: rows.results.map(projectRow) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await staffUser();
    const data = createProjectSchema.parse(await body(req));
    const now = new Date().toISOString();
    const id = `proj_${crypto.randomUUID().slice(0, 12)}`;

    await db()
      .prepare(`
        INSERT INTO inhouse_projects (
          id, title, client, domain, payout, estimated_hours, duration,
          status, required_skills, description, created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        data.title,
        data.client,
        data.domain,
        data.payout,
        data.estimatedHours,
        data.duration,
        JSON.stringify(data.requiredSkills),
        data.description,
        now,
        now,
        admin.email
      )
      .run();

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
          'CREATE_INHOUSE_PROJECT',
          id,
          `Created project "${data.title}" for ${data.client}`,
          now
        )
        .run();
    } catch {}

    const created = await db()
      .prepare('SELECT * FROM inhouse_projects WHERE id = ?')
      .bind(id)
      .first<any>();

    return json({ success: true, project: projectRow(created) }, 201);
  } catch (e) {
    return fail(e);
  }
}
