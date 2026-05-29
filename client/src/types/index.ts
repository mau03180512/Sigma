export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
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
  { id: 'deepseek-ai/deepseek-v4-flash', label: 'DeepSeek V4 Flash', tag: 'Fast coding', bestFor: 'Best for coding & agents' },
  { id: 'deepseek-ai/deepseek-v4-pro', label: 'DeepSeek V4 Pro', tag: 'Max power', bestFor: 'Best for complex tasks' },
  { id: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', tag: 'Deep reasoning', bestFor: 'Best for complex reasoning' },
  { id: 'qwen/qwen3.5-122b-a10b', label: 'Qwen 3.5', tag: 'General + coding', bestFor: 'Best for general + coding' },
  { id: 'mistralai/mistral-small-4-119b-2603', label: 'Mistral Small 4', tag: 'Complex tasks', bestFor: 'Best for complex tasks' },
  { id: 'minimaxai/minimax-m2.7', label: 'MiniMax M2.7', tag: 'Balanced', bestFor: 'Best for balanced chat' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1', label: 'Nemotron Super 49B', tag: 'Speed', bestFor: 'Best for speed & accuracy' },
  { id: 'google/gemma-4-31b-it', label: 'Gemma 4 31B', tag: 'Reasoning', bestFor: 'Best for reasoning & coding' },
];
