import {db,json,jobRow,fail} from '@/lib/server';
export async function GET(){try{const r=await db().prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC LIMIT 200').bind('open').all();return json({jobs:r.results.map(jobRow)})}catch(e){return fail(e)}}
