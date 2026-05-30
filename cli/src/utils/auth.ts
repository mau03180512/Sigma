import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { randomBytes, createHash } from 'node:crypto';
import { Credentials } from '../types.js';
import { loadCredentials, saveCredentials, removeCredentials } from './config.js';
import { printInfoMessage } from './render.js';

const FIREBASE_API_KEY = 'AIzaSyCwy3IUyA2BS4oU4egmcgYWMkvpz-pVf1Y';
const GOOGLE_CLIENT_ID = process.env.SIGMA_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.SIGMA_GOOGLE_CLIENT_SECRET || '';
const FIREBASE_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;

interface FirebaseRefreshResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function base64urlFromString(s: string): string {
  return base64url(Buffer.from(s));
}

function sha256(buf: Buffer): Buffer {
  return createHash('sha256').update(buf).digest();
}

function getSuccessHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Sigma AI — Signed In</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f172a; color: #e2e8f0; display: flex; align-items: center;
    justify-content: center; min-height: 100vh;
  }
  .card { background: #1e293b; border-radius: 16px; padding: 40px; width: 380px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
  .check { font-size: 48px; margin-bottom: 8px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  p { color: #94a3b8; font-size: 14px; }
</style></head>
<body><div class="card">
  <div class="check">✓</div>
  <h1>Signed in</h1>
  <p>${email}</p>
  <p style="margin-top:16px;color:#64748b">You can close this window.</p>
</div>
<script>setTimeout(() => window.close(), 2000);</script>
</body></html>`;
}

export async function loginWithBrowser(): Promise<Credentials> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      'Google OAuth credentials not configured.\n' +
      'Set SIGMA_GOOGLE_CLIENT_ID and SIGMA_GOOGLE_CLIENT_SECRET env vars,\n' +
      'or set SIGMA_GROQ_KEY to use direct Groq access without login.'
    );
  }
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(sha256(Buffer.from(codeVerifier)));
  const state = randomBytes(16).toString('hex');

  const creds = await new Promise<Credentials>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = req.url || '';

      if (req.method === 'GET' && url.startsWith('/callback')) {
        const parsed = new URL(url, 'http://localhost');
        const code = parsed.searchParams.get('code');
        const returnedState = parsed.searchParams.get('state');
        const error = parsed.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error: ${error}</h1><p>${parsed.searchParams.get('error_description') || ''}</p>`);
          return;
        }

        if (!code || returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Invalid request</h1>');
          return;
        }

        (async () => {
          try {
            const port = (server.address() as any).port;
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: `http://localhost:${port}/callback`,
                grant_type: 'authorization_code',
              }),
            });

            if (!tokenRes.ok) {
              const errText = await tokenRes.text();
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`<h1>Token exchange failed</h1><p>${errText}</p>`);
              return;
            }

            const tokenData = await tokenRes.json();
            const googleIdToken = tokenData.id_token;
            const googleRefreshToken = tokenData.refresh_token || '';
            const email = tokenData.email || (() => {
              try {
                const parts = googleIdToken.split('.');
                return JSON.parse(Buffer.from(parts[1], 'base64url').toString()).email || '';
              } catch { return ''; }
            })();

            const idpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestUri: `http://localhost:${port}/callback`,
                postBody: `id_token=${googleIdToken}&providerId=google.com`,
                returnSecureToken: true,
              }),
            });

            if (!idpRes.ok) {
              const errText = await idpRes.text();
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`<h1>Firebase sign-in failed</h1><p>${errText}</p>`);
              return;
            }

            const fbData = await idpRes.json();
            const userEmail: string = email || fbData.email || '';
            const creds: Credentials = {
              idToken: fbData.idToken,
              refreshToken: fbData.refreshToken,
              email: userEmail,
              expiresAt: Date.now() + parseInt(fbData.expiresIn, 10) * 1000,
            };

            await saveCredentials(creds);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getSuccessHtml(userEmail));
            server.close();
            resolve(creds);
          } catch (e: any) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Error</h1><p>${e.message}</p>`);
          }
        })();
        return;
      }

      res.writeHead(302, { Location: `/callback?error=not_found` });
      res.end();
    });

    server.listen(0, 'localhost', () => {
      const port = (server.address() as any).port;
      const redirectUri = `http://localhost:${port}/callback`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      });

      printInfoMessage(`Opening browser for Google sign-in...`);
      const cmd = platform() === 'win32' ? `start "" "${authUrl}"`
        : platform() === 'darwin' ? `open "${authUrl}"`
        : `xdg-open "${authUrl}"`;
      try { execSync(cmd); } catch {
        printInfoMessage(`Open this URL in your browser:\n${authUrl}`);
      }
    });

    server.on('error', reject);
  });

  return creds;
}

export async function getValidToken(): Promise<string | null> {
  let creds = await loadCredentials();
  if (!creds) return null;

  if (creds.expiresAt && Date.now() < creds.expiresAt - 60000) {
    return creds.idToken;
  }

  try {
    const res = await fetch(FIREBASE_REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: creds.refreshToken,
      }),
    });

    if (!res.ok) {
      await removeCredentials();
      return null;
    }

    const data: FirebaseRefreshResponse = await res.json();
    const newCreds: Credentials = {
      idToken: data.id_token,
      refreshToken: data.refresh_token || creds.refreshToken,
      email: creds.email,
      expiresAt: Date.now() + parseInt(data.expires_in, 10) * 1000,
    };

    await saveCredentials(newCreds);
    return newCreds.idToken;
  } catch {
    await removeCredentials();
    return null;
  }
}
