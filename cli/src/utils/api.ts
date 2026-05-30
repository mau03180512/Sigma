import { Message } from '../types.js';

const API_BASE = process.env.SIGMA_API_URL || 'https://sigma-server-production.up.railway.app';

const ALLOWED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.2-90b-vision-preview',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b',
];

function validateModel(model?: string): string {
  if (model && ALLOWED_MODELS.includes(model)) return model;
  return 'llama-3.3-70b-versatile';
}

export async function* streamChat(
  messages: Message[],
  options?: {
    model?: string;
    mode?: string;
    provider?: 'groq' | 'nim';
  }
): AsyncGenerator<{ content?: string; error?: string; done?: boolean }> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: options?.model,
      mode: options?.mode,
      provider: options?.provider ?? 'groq',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
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
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchModels(): Promise<string[]> {
  return ALLOWED_MODELS;
}

export { API_BASE };
