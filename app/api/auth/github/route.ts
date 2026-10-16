import { getGitHubConfig } from '@/lib/oauth-config';

export async function GET(r: Request) {
  const host = r.headers.get('host') || '127.0.0.1:5173';
  const proto = r.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const callbackUrl = `${origin}/api/auth/github/callback`;

  const state = crypto.randomUUID();
  const stateCookie = `hireease_github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;

  const { clientId, isConfigured } = getGitHubConfig();

  let redirectDestination: string;

  if (isConfigured) {
    // Production GitHub OAuth
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    githubAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubAuthUrl.searchParams.set('state', state);
    githubAuthUrl.searchParams.set('allow_signup', 'true');
    redirectDestination = githubAuthUrl.toString();
  } else {
    // Local / Dev GitHub Sign-In Chooser
    const consentUrl = new URL(`${origin}/auth/github-consent`);
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
