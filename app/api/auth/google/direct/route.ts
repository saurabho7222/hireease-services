import { json } from '@/lib/server';

/**
 * Disabled endpoint: Direct unauthenticated credential-less login is forbidden.
 */
export async function POST() {
  return json({ error: 'Direct mock authentication is disabled for security.' }, 403);
}

export async function GET() {
  return json({ error: 'Direct mock authentication is disabled for security.' }, 403);
}
