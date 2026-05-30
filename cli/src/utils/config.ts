import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { Credentials } from '../types.js';

function getConfigDir(): string {
  const base = platform() === 'win32'
    ? process.env.APPDATA || join(homedir(), 'AppData', 'Roaming')
    : join(homedir(), '.config');

  return join(base, 'sigma-ai');
}

function getCredentialsPath(): string {
  return join(getConfigDir(), 'credentials.json');
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const data = await readFile(getCredentialsPath(), 'utf-8');
    return JSON.parse(data) as Credentials;
  } catch {
    return null;
  }
}

export async function saveCredentials(creds: Credentials): Promise<void> {
  const dir = getConfigDir();
  await mkdir(dir, { recursive: true });
  await writeFile(getCredentialsPath(), JSON.stringify(creds, null, 2), 'utf-8');
}

export async function removeCredentials(): Promise<void> {
  try {
    const { rm } = await import('node:fs/promises');
    await rm(getCredentialsPath(), { force: true });
  } catch {
    // ignore
  }
}
