import { json, staffUser, fail, ApiError } from '@/lib/server';
import { getGoogleConfig, saveGoogleConfig } from '@/lib/oauth-config';

export async function GET() {
  const config = getGoogleConfig();
  return json({
    configured: config.isConfigured,
    clientId: config.isConfigured ? config.clientId : null
  });
}

export async function POST(r: Request) {
  try {
    // Only authenticated administrator/recruiter staff can update OAuth configuration
    await staffUser();

    let body: any;
    try {
      body = await r.json();
    } catch {
      throw new ApiError('Invalid JSON request body.', 400);
    }

    const { clientId, clientSecret } = body || {};
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length < 5) {
      throw new ApiError('Please provide a valid Google Client ID.', 400);
    }

    // Prevent CRLF / Newline Injection
    if (/[\r\n]/.test(clientId) || (clientSecret && /[\r\n]/.test(clientSecret))) {
      throw new ApiError('Credentials cannot contain newline or carriage return characters.', 400);
    }

    const saved = saveGoogleConfig(clientId.trim(), typeof clientSecret === 'string' ? clientSecret.trim() : undefined);
    if (!saved) {
      throw new ApiError('Failed to write credentials to configuration storage.', 500);
    }

    return json({
      success: true,
      message: 'Google OAuth credentials updated successfully.',
      configured: true,
      clientId: clientId.trim()
    });
  } catch (err: any) {
    return fail(err);
  }
}
