import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import Admin from './admin';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/auth?return_to=%2Fadmin');
  }

  // Secure backend role verification
  if (user.role !== 'admin') {
    // Candidate attempting to access admin panel is redirected to Candidate Panel
    redirect('/dashboard');
  }

  return <Admin email={user.email} />;
}
