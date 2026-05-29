const ALLOWED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.2-90b-vision-preview',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b',
];

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const API_BASE = 'https://api.groq.com/openai/v1';

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
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const messageCount = options.messages.length;
  const totalChars = options.messages.reduce((sum, m) => sum + m.content.length, 0);
  const apiKeyPreview = apiKey.slice(0, 12) + '...';

  console.log(`[API] Request: model=${model}, messages=${messageCount}, chars=${totalChars}, key=${apiKeyPreview}`);

  const response = await fetch(`${API_BASE}/chat/completions`, {
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
    let errorText = 'unknown error';
    try {
      errorText = await response.text();
    } catch {
      try {
        errorText = JSON.stringify(await response.json());
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
    }
    console.error(`[API] Error: status=${response.status}, body=${errorText}, model=${model}, messages=${messageCount}, chars=${totalChars}`);
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  console.log(`[API] Stream started: model=${model}, status=${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let streamedChars = 0;

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
          if (content) {
            streamedChars += content.length;
            yield content;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
    console.log(`[API] Stream completed: model=${model}, chars=${streamedChars}`);
  } finally {
    reader.releaseLock();
  }
}
