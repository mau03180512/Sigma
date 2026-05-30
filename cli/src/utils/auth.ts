import { createServer } from 'node:http';
import { execSync } from 'node:child_process';
import { homedir, platform } from 'node:os';
import { randomBytes } from 'node:crypto';
import { Credentials } from '../types.js';
import { loadCredentials, saveCredentials, removeCredentials } from './config.js';
import { printInfoMessage, printErrorMessage } from './render.js';

const FIREBASE_API_KEY = 'AIzaSyCwy3IUyA2BS4oU4egmcgYWMkvpz-pVf1Y';
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

function getLoginHtml(state: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sigma AI — Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0; display: flex; align-items: center;
      justify-content: center; min-height: 100vh;
    }
    .card {
      background: #1e293b; border-radius: 16px; padding: 40px; width: 380px;
      text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .logo { font-size: 32px; margin-bottom: 4px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .sub { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }
    .field { margin-bottom: 16px; text-align: left; }
    label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
    input {
      width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155;
      background: #0f172a; color: #e2e8f0; font-size: 14px; outline: none;
    }
    input:focus { border-color: #3b82f6; }
    .btn {
      width: 100%; padding: 10px; border-radius: 8px; border: none;
      background: #3b82f6; color: #fff; font-size: 15px; font-weight: 600;
      cursor: pointer; margin-top: 8px;
    }
    .btn:hover { background: #2563eb; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #status { margin-top: 16px; font-size: 13px; }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Σ</div>
    <h1>Sigma AI</h1>
    <p class="sub">Sign in to use the Sigma AI CLI</p>
    <form id="loginForm">
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="you@example.com" required autofocus>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Enter your password" required>
      </div>
      <button class="btn" id="loginBtn" type="submit">Sign In</button>
    </form>
    <div id="status"></div>
  </div>
  <script>
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const status = document.getElementById('status');
      btn.disabled = true;
      status.className = '';
      status.textContent = 'Signing in...';
      try {
        const res = await fetch('/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            state: '${state}',
          }),
        });
        if (res.ok) {
          status.className = 'success';
          status.textContent = 'Signed in successfully! You can close this window.';
          setTimeout(() => window.close(), 1500);
        } else {
          const err = await res.text();
          status.className = 'error';
          status.textContent = err;
          btn.disabled = false;
        }
      } catch (e) {
        status.className = 'error';
        status.textContent = e.message;
        btn.disabled = false;
      }
    };
  </script>
</body>
</html>`;
}

export async function loginWithBrowser(): Promise<Credentials> {
  const state = randomBytes(16).toString('hex');

  const creds = await new Promise<Credentials>((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getLoginHtml(state));
        return;
      }

      if (req.method === 'POST' && req.url === '/callback') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (data.state !== state) {
              res.writeHead(400);
              res.end('Invalid state');
              return;
            }
            const firebaseRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email, password: data.password, returnSecureToken: true }),
            });
            if (!firebaseRes.ok) {
              const err = await firebaseRes.json();
              const msg = err?.error?.message || 'Login failed';
              res.writeHead(401);
              res.end(msg);
              return;
            }
            const fbData = await firebaseRes.json();
            const creds: Credentials = {
              idToken: fbData.idToken,
              refreshToken: fbData.refreshToken,
              email: fbData.email,
              expiresAt: Date.now() + parseInt(fbData.expiresIn, 10) * 1000,
            };
            await saveCredentials(creds);
            res.writeHead(200);
            res.end('OK');
            server.close();
            resolve(creds);
          } catch (e: any) {
            res.writeHead(400);
            res.end(e.message);
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(0, 'localhost', () => {
      const addr = server.address();
      const port = typeof addr === 'string' ? parseInt(addr) : addr?.port || 0;
      printInfoMessage(`Opening browser for login...`);
      const url = `http://localhost:${port}`;

      const cmd = platform() === 'win32' ? `start "" "${url}"`
        : platform() === 'darwin' ? `open "${url}"`
        : `xdg-open "${url}"`;
      try { execSync(cmd); } catch {
        printInfoMessage(`Open this URL in your browser: ${url}`);
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
