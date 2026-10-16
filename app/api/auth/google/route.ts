import { getGoogleConfig } from '@/lib/oauth-config';

export async function GET(r: Request) {
  const host = r.headers.get('host') || '127.0.0.1:5173';
  const proto = r.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const callbackUrl = `${origin}/api/auth/google/callback`;

  const state = crypto.randomUUID();
  const stateCookie = `hireease_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;

  const { clientId, isConfigured } = getGoogleConfig();
  let redirectDestination: string;

  if (isConfigured && clientId) {
    // Production Google OAuth authorization screen
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('access_type', 'online');
    redirectDestination = googleAuthUrl.toString();
  } else {
    // Graceful fallback to consent / account chooser
    const consentUrl = new URL(`${origin}/auth/google-consent`);
    consentUrl.searchParams.set('state', state);
    consentUrl.searchParams.set('redirect_uri', callbackUrl);
    redirectDestination = consentUrl.toString();
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectDestination,
      'Set-Cookie': stateCookie,
      'Cache-Control': 'no-store'
    }
  });
}
