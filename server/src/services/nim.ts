const ALLOWED_MODELS = [
  'deepseek-ai/deepseek-v4-flash',
  'deepseek-ai/deepseek-v4-pro',
  'deepseek-ai/deepseek-r1',
  'qwen/qwen3.5-122b-a10b',
  'mistralai/mistral-small-4-119b-2603',
  'minimaxai/minimax-m2.7',
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'google/gemma-4-31b-it',
];

const DEFAULT_MODEL = 'deepseek-ai/deepseek-v4-flash';

const NIM_API_BASE = 'https://integrate.api.nvidia.com/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NIMOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export function validateModel(model: string): string {
  if (ALLOWED_MODELS.includes(model)) return model;
  return DEFAULT_MODEL;
}

export async function* streamChat(options: NIMOptions): AsyncGenerator<string> {
  const model = validateModel(options.model || DEFAULT_MODEL);
  const apiKey = process.env.NVIDIA_NIM_API_KEY;

  if (!apiKey) {
    throw new Error('NVIDIA_NIM_API_KEY not configured');
  }

  const response = await fetch(`${NIM_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.95,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM API error ${response.status}: ${errorText}`);
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
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
