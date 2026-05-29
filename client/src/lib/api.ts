import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

export async function streamChat(
  messages: { role: string; content: any }[],
  model: string,
  onChunk: (data: string) => void,
  onDone: (conversationId: string) => void,
  onError: (error: string) => void,
  conversationId?: string,
  mode?: string,
): Promise<AbortController> {
  const controller = new AbortController();
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, model, conversationId, mode }),
    signal: controller.signal,
  });

  if (!response.ok) {
    const err = await response.text();
    onError(err);
    return controller;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError('No response body');
    return controller;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.done) {
              onDone(parsed.conversationId);
              return;
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError(err.message);
      }
    }
  })();

  return controller;
}

export async function getConversations() {
  const res = await authFetch(`${API_URL}/api/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function getConversation(id: string) {
  const res = await authFetch(`${API_URL}/api/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return res.json();
}

export async function createConversation(title?: string, model?: string) {
  const res = await authFetch(`${API_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, model }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(id: string) {
  const res = await authFetch(`${API_URL}/api/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}
