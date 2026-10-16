import { headers } from 'next/headers';
import {
  parseCookieHeader,
  deleteSession,
  buildClearSessionCookie
} from '@/lib/auth-server';

function clearCookiesResponse(body: unknown, status = 200, redirectLocation?: string) {
  const headersInit = new Headers();
  headersInit.append('Set-Cookie', buildClearSessionCookie());
  // Clear legacy mock cookie as well
  headersInit.append('Set-Cookie', '__sites_local_auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  headersInit.set('Cache-Control', 'no-store, private');

  if (redirectLocation) {
    headersInit.set('Location', redirectLocation);
    return new Response(null, { status: 303, headers: headersInit });
  }

  headersInit.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status, headers: headersInit });
}

export async function POST(r: Request) {
  const reqHeaders = await headers();
  const cookies = parseCookieHeader(reqHeaders.get('cookie'));
  const sessionId = cookies['hireease_session'];

  if (sessionId) {
    await deleteSession(sessionId);
  }

  return clearCookiesResponse({ success: true, redirectUrl: '/auth' });
}

export async function GET(r: Request) {
  const reqHeaders = await headers();
  const cookies = parseCookieHeader(reqHeaders.get('cookie'));
  const sessionId = cookies['hireease_session'];

  if (sessionId) {
    await deleteSession(sessionId);
  }

  return clearCookiesResponse(null, 303, '/auth');
}
