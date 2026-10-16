import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import Dashboard from './dashboard';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const role = typeof params.role === 'string' ? params.role : '';

  const user = await getAuthUser();
  if (!user) {
    const returnTo = '/dashboard' + (role ? '?role=' + encodeURIComponent(role) : '');
    redirect(`/auth?return_to=${encodeURIComponent(returnTo)}`);
  }

  return <Dashboard userName={user.name} email={user.email} role={role} />;
}
