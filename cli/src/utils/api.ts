import { getValidToken } from './auth.js';
import { Message } from '../types.js';

const API_BASE = process.env.SIGMA_API_URL || 'https://sigma-server-production.up.railway.app';
const GROQ_API_KEY = process.env.SIGMA_GROQ_KEY || '';

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

async function* streamFromGroqDirect(
  messages: Message[],
  model: string
): AsyncGenerator<{ content?: string; done?: boolean }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  const reader = response.body?.getReader();
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
        const data = trimmed.slice(6);
        if (data === '[DONE]') { yield { done: true }; return; }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield { content };
        } catch {
          // skip
        }
      }
    }
    yield { done: true };
  } finally {
    reader.releaseLock();
  }
}

export async function* streamChat(
  messages: Message[],
  options?: {
    model?: string;
    conversationId?: string;
    mode?: string;
    provider?: 'groq' | 'nim';
  }
): AsyncGenerator<{ content?: string; conversationId?: string; error?: string; done?: boolean }> {
  // If GROQ_API_KEY is set, call Groq directly (no login needed)
  if (GROQ_API_KEY) {
    const systemMsg = { role: 'system' as const, content: 'You are Sigma, a versatile AI assistant.' };
    const chatMessages = [systemMsg, ...messages];
    const model = validateModel(options?.model);

    yield* streamFromGroqDirect(chatMessages, model);
    return;
  }

  // Otherwise, use the backend (requires Firebase auth)
  const token = await getValidToken();
  if (!token) {
    throw new Error('Not authenticated. Run `sigma-ai login` first, or set SIGMA_GROQ_KEY env var.');
  }

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
          // skip
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
