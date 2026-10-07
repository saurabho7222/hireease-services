import {db,staffUser,body,json,fail,ApiError} from '@/lib/server';
import {z} from 'zod';
export async function PATCH(r:Request){try{const u=await staffUser();const data=z.object({id:z.string().uuid(),status:z.enum(['submitted','review','interview','selected','not_selected'])}).parse(await body(r));const result=await db().prepare('UPDATE applications SET status=?,updated_at=?,updated_by=? WHERE id=?').bind(data.status,new Date().toISOString(),u.userId,data.id).run();if(!result.meta.changes)throw new ApiError('Application not found.',404);return json({updated:true})}catch(e){return fail(e)}}
