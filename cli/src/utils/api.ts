import { getValidToken } from './auth.js';
import { Message } from '../types.js';

const API_BASE = process.env.SIGMA_API_URL || 'https://sigma-server-production.up.railway.app';

export async function* streamChat(
  messages: Message[],
  options?: {
    model?: string;
    conversationId?: string;
    mode?: string;
    provider?: 'groq' | 'nim';
  }
): AsyncGenerator<{ content?: string; conversationId?: string; error?: string; done?: boolean }> {
  const token = await getValidToken();
  if (!token) throw new Error('Not authenticated. Run `sigma-ai login` first.');

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      model: options?.model,
      conversationId: options?.conversationId,
      mode: options?.mode,
      provider: options?.provider ?? 'groq',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error('Session expired. Run `sigma-ai login` again.');
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          yield parsed;
        } catch {
          // skip malformed
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchModels(): Promise<string[]> {
  const token = await getValidToken();
  if (!token) throw new Error('Not authenticated');

  // The backend validates known models; fetch from the chat service,
  // or use the static list from types.ts.
  const res = await fetch(`${API_BASE}/health`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);

  return [
    'llama-3.3-70b-versatile',
    'llama-3.2-90b-vision-preview',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'deepseek-r1-distill-llama-70b',
  ];
}

export { API_BASE };
