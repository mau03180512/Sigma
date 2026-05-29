export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface StreamChunk {
  content?: string;
  conversationId?: string;
  error?: string;
  done?: boolean;
}

export type SlashCommand = '/ctf' | '/audit' | '/pentest' | '/malware' | '/osint' | '/explain' | '/build' | '/ir';

export const SLASH_COMMANDS: { command: SlashCommand; label: string; description: string }[] = [
  { command: '/ctf', label: 'CTF Mode', description: 'Capture The Flag challenge solving' },
  { command: '/audit', label: 'Code Audit', description: 'Security code review & analysis' },
  { command: '/pentest', label: 'Pentest Mode', description: 'Penetration testing methodology' },
  { command: '/malware', label: 'Malware Analysis', description: 'Reverse engineering & analysis' },
  { command: '/osint', label: 'OSINT Mode', description: 'Open source intelligence gathering' },
  { command: '/explain', label: 'Explain', description: 'Break down complex concepts' },
  { command: '/build', label: 'Build Mode', description: 'Architect & implement solutions' },
  { command: '/ir', label: 'Incident Response', description: 'IR lifecycle & procedures' },
];

export const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tag: 'Versatile', bestFor: 'Best for general tasks' },
  { id: 'llama-3.2-90b-vision-preview', label: 'Llama 3.2 90B Vision', tag: 'Vision', bestFor: 'Best for images & files' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', tag: 'MoE', bestFor: 'Best for complex reasoning' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B', tag: 'Lightweight', bestFor: 'Best for balanced chat' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tag: 'Fast', bestFor: 'Best for speed' },
];
