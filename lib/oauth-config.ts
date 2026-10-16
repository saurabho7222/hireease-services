import fs from 'node:fs';
import path from 'node:path';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (!fs.existsSync(filePath)) return result;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch (err) {
    console.warn('Could not parse .env file:', err);
  }
  return result;
}

function getEnvFilePath(): string {
  return path.resolve(process.cwd(), '.env');
}

function findClientSecretJson(): { clientId?: string; clientSecret?: string } {
  try {
    const cwd = process.cwd();
    const candidateDirs = [cwd, path.resolve(cwd, 'hireease-site'), path.resolve(cwd, '..')];
    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      const secretFile = files.find(f => f.startsWith('client_secret') && f.endsWith('.json'));
      if (secretFile) {
        const fullPath = path.join(dir, secretFile);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const config = data.web || data.installed;
        if (config?.client_id) {
          return {
            clientId: config.client_id,
            clientSecret: config.client_secret || ''
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not read client_secret JSON:', err);
  }
  return {};
}

export function getGoogleConfig(): GoogleOAuthConfig {
  let clientId = (typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_ID || process.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID : '') || '';
  let clientSecret = (typeof process !== 'undefined' ? process.env?.GOOGLE_CLIENT_SECRET : '') || '';

  // If not found in process.env, parse .env directly
  if (!clientId || !clientSecret) {
    const fileEnv = parseEnvFile(getEnvFilePath());
    if (!clientId && fileEnv['GOOGLE_CLIENT_ID']) {
      clientId = fileEnv['GOOGLE_CLIENT_ID'];
    }
    if (!clientSecret && fileEnv['GOOGLE_CLIENT_SECRET']) {
      clientSecret = fileEnv['GOOGLE_CLIENT_SECRET'];
    }
  }

  // If still not found, check for client_secret*.json file
  if (!clientId || !clientSecret) {
    const jsonSecret = findClientSecretJson();
    if (!clientId && jsonSecret.clientId) {
      clientId = jsonSecret.clientId;
    }
    if (!clientSecret && jsonSecret.clientSecret) {
      clientSecret = jsonSecret.clientSecret;
    }
  }

  clientId = clientId.trim();
  clientSecret = clientSecret.trim();

  const isConfigured = Boolean(
    clientId &&
    clientId.length > 5 &&
    !clientId.includes('your-google-client-id')
  );

  return {
    clientId,
    clientSecret,
    isConfigured
  };
}

export function saveGoogleConfig(clientId: string, clientSecret?: string): boolean {
  try {
    const envPath = getEnvFilePath();
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const cleanClientId = clientId.trim();
    const cleanSecret = (clientSecret || '').trim();

    // Replace or add GOOGLE_CLIENT_ID
    if (/^[#\s]*GOOGLE_CLIENT_ID=.*/m.test(content)) {
      content = content.replace(/^[#\s]*GOOGLE_CLIENT_ID=.*/m, `GOOGLE_CLIENT_ID=${cleanClientId}`);
    } else {
      content += `\nGOOGLE_CLIENT_ID=${cleanClientId}`;
    }

    if (cleanSecret) {
      if (/^[#\s]*GOOGLE_CLIENT_SECRET=.*/m.test(content)) {
        content = content.replace(/^[#\s]*GOOGLE_CLIENT_SECRET=.*/m, `GOOGLE_CLIENT_SECRET=${cleanSecret}`);
      } else {
        content += `\nGOOGLE_CLIENT_SECRET=${cleanSecret}`;
      }
    }

    fs.writeFileSync(envPath, content, 'utf-8');

    // Update in-memory process.env
    if (typeof process !== 'undefined') {
      process.env.GOOGLE_CLIENT_ID = cleanClientId;
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = cleanClientId;
      if (cleanSecret) {
        process.env.GOOGLE_CLIENT_SECRET = cleanSecret;
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to save Google OAuth configuration:', err);
    return false;
  }
}

export interface GoogleTokenPayload {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  email_verified?: string | boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Google ID token credential.');
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`, {
    method: 'GET'
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Google token verification failed:', errorBody);
    throw new Error('Google token validation failed. The sign-in token may be expired or invalid.');
  }

  const payload: any = await res.json();

  if (!payload.email) {
    throw new Error('No verified email returned from Google.');
  }

  const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;
  if (!emailVerified) {
    throw new Error('The Google account email is not verified.');
  }

  return {
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    picture: payload.picture,
    sub: payload.sub,
    email_verified: true
  };
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  isConfigured: boolean;
}

export function getGitHubConfig(): GitHubOAuthConfig {
  let clientId = (typeof process !== 'undefined' ? process.env?.GITHUB_CLIENT_ID || process.env?.NEXT_PUBLIC_GITHUB_CLIENT_ID : '') || '';
  let clientSecret = (typeof process !== 'undefined' ? process.env?.GITHUB_CLIENT_SECRET : '') || '';

  if (!clientId || !clientSecret) {
    const fileEnv = parseEnvFile(getEnvFilePath());
    if (!clientId && fileEnv['GITHUB_CLIENT_ID']) {
      clientId = fileEnv['GITHUB_CLIENT_ID'];
    }
    if (!clientSecret && fileEnv['GITHUB_CLIENT_SECRET']) {
      clientSecret = fileEnv['GITHUB_CLIENT_SECRET'];
    }
  }

  clientId = clientId.trim();
  clientSecret = clientSecret.trim();

  const isConfigured = Boolean(
    clientId &&
    clientId.length > 3 &&
    !clientId.includes('your-github-client-id')
  );

  return {
    clientId,
    clientSecret,
    isConfigured
  };
}

export function saveGitHubConfig(clientId: string, clientSecret?: string): boolean {
  try {
    const envPath = getEnvFilePath();
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const cleanClientId = clientId.trim();
    const cleanSecret = (clientSecret || '').trim();

    if (/^[#\s]*GITHUB_CLIENT_ID=.*/m.test(content)) {
      content = content.replace(/^[#\s]*GITHUB_CLIENT_ID=.*/m, `GITHUB_CLIENT_ID=${cleanClientId}`);
    } else {
      content += `\nGITHUB_CLIENT_ID=${cleanClientId}`;
    }

    if (cleanSecret) {
      if (/^[#\s]*GITHUB_CLIENT_SECRET=.*/m.test(content)) {
        content = content.replace(/^[#\s]*GITHUB_CLIENT_SECRET=.*/m, `GITHUB_CLIENT_SECRET=${cleanSecret}`);
      } else {
        content += `\nGITHUB_CLIENT_SECRET=${cleanSecret}`;
      }
    }

    fs.writeFileSync(envPath, content, 'utf-8');

    if (typeof process !== 'undefined') {
      process.env.GITHUB_CLIENT_ID = cleanClientId;
      process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = cleanClientId;
      if (cleanSecret) {
        process.env.GITHUB_CLIENT_SECRET = cleanSecret;
      }
    }

    return true;
  } catch (err) {
    console.error('Failed to save GitHub OAuth configuration:', err);
    return false;
  }
}

