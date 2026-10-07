import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Admin from './admin';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/admin');return <Admin email={u.email}/>}
