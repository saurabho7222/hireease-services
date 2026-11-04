import {db,user,staffUser,body,json,fail,ApiError,setupKey,jobRow,publicProfile} from '@/lib/server';
import {isSuperAdminEmail} from '@/lib/auth-server';
export async function GET() {
  try {
    await staffUser();
    const [jobs, applications, profiles] = await Promise.all([
      db().prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 1000').all<any>(),
      db().prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT 1000').all<any>(),
      db().prepare('SELECT * FROM profiles ORDER BY updated_at DESC LIMIT 1000').all<any>()
    ]);

    return json({
      jobs: jobs.results.map(jobRow),
      candidates: profiles.results.map(publicProfile),
      applications: applications.results.map(a => {
        let snap: any = {};
        try {
          snap = JSON.parse(a.snapshot || '{}');
        } catch {
          snap = {};
        }
        return {
          id: a.id,
          jobId: a.job_id,
          jobTitle: a.job_title,
          company: a.company,
          isSample: !!a.is_sample,
          status: a.status,
          notes: snap.adminNotes || '',
          rating: snap.adminRating || 0,
          statusHistory: snap.statusHistory || [],
          interviewDate: snap.interviewDate || null,
          externalUrl: snap.externalUrl || null,
          platform: a.company || snap.platform || 'micro1',
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          profile: publicProfile(snap)
        };
      })
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: Request) {
  try {
    const u = await user();
    const data = await body(r);
    const key = setupKey();
    if (isSuperAdminEmail(u.email) || u.role === 'admin' || (key && data.key === key)) {
      await db().prepare('INSERT INTO staff(id,user_id,email,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, email=excluded.email').bind('owner', u.userId, u.email, new Date().toISOString()).run();
      return json({ activated: true });
    }
    throw new ApiError('The workspace setup code is not valid.', 403);
  } catch (e) {
    return fail(e);
  }
}
