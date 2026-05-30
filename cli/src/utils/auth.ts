import { Credentials } from '../types.js';
import { loadCredentials, saveCredentials, removeCredentials } from './config.js';

const FIREBASE_API_KEY = process.env.SIGMA_FIREBASE_API_KEY || 'AIzaSyCkH3XKPwE9dhO8isYRzTDGqiofgThZotk';
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const FIREBASE_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;

interface FirebaseSignInResponse {
  idToken: string;
  refreshToken: string;
  email: string;
  expiresIn: string;
  localId: string;
}

interface FirebaseRefreshResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

export async function loginWithEmail(email: string, password: string): Promise<Credentials> {
  const res = await fetch(FIREBASE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!res.ok) {
    const err = await res.json();
    const msg = err?.error?.message || 'Unknown Firebase error';
    throw new Error(`Login failed: ${msg}`);
  }

  const data: FirebaseSignInResponse = await res.json();
  const expiresAt = Date.now() + parseInt(data.expiresIn, 10) * 1000;

  const creds: Credentials = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    email: data.email,
    expiresAt,
  };

  await saveCredentials(creds);
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
