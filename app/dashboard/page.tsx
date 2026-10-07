import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{role?:string}>}){const params=await searchParams;const role=typeof params.role==='string'?params.role:'';return <Authenticated role={role}/>}
async function Authenticated({role}:{role:string}){const u=await requireChatGPTUser('/dashboard'+(role?'?role='+encodeURIComponent(role):''));return <Dashboard userName={u.displayName} email={u.email} role={role}/>}
