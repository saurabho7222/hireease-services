import { json } from '@/lib/server';
import { getGitHubConfig, saveGitHubConfig } from '@/lib/oauth-config';

export async function GET() {
  const config = getGitHubConfig();
  return json({
    configured: config.isConfigured,
    clientId: config.isConfigured ? config.clientId : null
  });
}

export async function POST(r: Request) {
  try {
    let body: any;
    try {
      body = await r.json();
    } catch {
      return json({ error: 'Invalid JSON request body.' }, 400);
    }

    const { clientId, clientSecret } = body || {};
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length < 3) {
      return json({ error: 'Please provide a valid GitHub Client ID.' }, 400);
    }

    const saved = saveGitHubConfig(clientId, clientSecret);
    if (!saved) {
      return json({ error: 'Failed to write credentials to .env configuration.' }, 500);
    }

    return json({
      success: true,
      message: 'GitHub OAuth credentials updated successfully.',
      configured: true,
      clientId: clientId.trim()
    });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to update GitHub configuration.' }, 500);
  }
}
