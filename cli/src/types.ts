export interface Credentials {
  idToken: string;
  refreshToken: string;
  email?: string;
  expiresAt?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  content?: string;
  conversationId?: string;
  error?: string;
  done?: boolean;
}

export interface Model {
  id: string;
  label: string;
  tag: string;
  bestFor: string;
}

export const MODELS: Model[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tag: 'Versatile', bestFor: 'Best for all tasks' },
  { id: 'llama-3.2-90b-vision-preview', label: 'Llama 3.2 90B Vision', tag: 'Vision', bestFor: 'Best for images' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B', tag: 'Lightweight', bestFor: 'Best for balanced chat' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tag: 'Fast', bestFor: 'Best for speed' },
];

export const SLASH_COMMANDS = [
  '/ctf', '/audit', '/pentest', '/malware',
  '/osint', '/explain', '/build', '/ir',
] as const;

export type SlashCommand = typeof SLASH_COMMANDS[number];
