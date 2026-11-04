import { json } from '@/lib/server';

/**
 * Disabled endpoint: Direct unauthenticated social authentication is forbidden.
 * Authentication must proceed through standard verified OAuth flows (/api/auth/google/verify or OAuth 2.0 PKCE callbacks).
 */
export async function POST() {
  return json({ error: 'This authentication endpoint is disabled for security.' }, 403);
}

export async function GET() {
  return json({ error: 'This authentication endpoint is disabled for security.' }, 403);
}
