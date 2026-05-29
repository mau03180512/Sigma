import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('SUPABASE_URL is missing or empty');
  console.error('Available env vars:', Object.keys(process.env).join(', '));
}

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_KEY is missing or empty');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createConversation(conversation: Partial<Conversation>): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: conversation.user_id,
      title: conversation.title || 'New Chat',
      model: conversation.model || 'deepseek-ai/deepseek-v4-flash',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveMessage(message: Partial<Message>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversation_id,
      role: message.role,
      content: message.content,
      model: message.model,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
