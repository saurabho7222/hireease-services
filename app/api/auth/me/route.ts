import { json } from '@/lib/server';
import { getAuthUser } from '@/lib/auth-server';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return json({ user: null, authenticated: false });
  }

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider
    },
    authenticated: true
  });
}
