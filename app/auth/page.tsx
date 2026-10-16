import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-server';
import AuthClient from './auth-client';

export const dynamic = 'force-dynamic';

export default async function AuthPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; return_to?: string; role?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === 'signup' ? 'signup' : 'signin';
  const returnTo = typeof params.return_to === 'string' ? params.return_to : '';

  // If already authenticated, redirect according to role
  const user = await getAuthUser();
  if (user) {
    if (returnTo && returnTo.startsWith('/')) {
      redirect(returnTo);
    }
    if (user.role === 'admin') {
      redirect('/admin');
    }
    redirect('/dashboard');
  }

  return <AuthClient initialMode={mode} returnTo={returnTo} requestedRole={params.role} />;
}
