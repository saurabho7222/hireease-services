export async function GET(r: Request) {
  const host = r.headers.get('host') || '127.0.0.1:5173';
  const proto = r.headers.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const origin = `${proto}://${host}`;
  const callbackUrl = `${origin}/api/auth/linkedin/callback`;

  const state = crypto.randomUUID();
  const stateCookie = `hireease_linkedin_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;

  const clientId = typeof process !== 'undefined' ? process.env?.LINKEDIN_CLIENT_ID : undefined;
  const clientSecret = typeof process !== 'undefined' ? process.env?.LINKEDIN_CLIENT_SECRET : undefined;

  let redirectDestination: string;

  if (clientId && clientSecret && clientId.trim().length > 0) {
    // Production LinkedIn OAuth 2.0 (OpenID Connect)
    const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    linkedinAuthUrl.searchParams.set('response_type', 'code');
    linkedinAuthUrl.searchParams.set('client_id', clientId.trim());
    linkedinAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    linkedinAuthUrl.searchParams.set('state', state);
    linkedinAuthUrl.searchParams.set('scope', 'openid profile email');
    redirectDestination = linkedinAuthUrl.toString();
  } else {
    // Local / Dev LinkedIn Account Chooser
    const consentUrl = new URL(`${origin}/auth/linkedin-consent`);
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
