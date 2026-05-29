import { create } from 'zustand';
import { Message, Conversation, Attachment } from '../types';
import { streamChat, getConversations as fetchConversations, getConversation as fetchConversation, deleteConversation as apiDeleteConversation } from '../lib/api';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  selectedModel: string;
  streamedContent: string;
  error: string | null;

  setSelectedModel: (model: string) => void;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, mode?: string, attachments?: Attachment[]) => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
  stopStreaming: () => void;
  clearError: () => void;
}

function buildContentParts(content: string, attachments?: Attachment[]) {
  if (!attachments?.length) return content;
  const parts: any[] = [{ type: 'text', text: content }];
  for (const att of attachments) {
    if (att.type.startsWith('image/') && att.dataUrl) {
      parts.push({ type: 'image_url', image_url: { url: att.dataUrl } });
    }
  }
  return parts;
}

let streamController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  selectedModel: localStorage.getItem('sigma-selected-model') || 'llama-3.3-70b-versatile',
  streamedContent: '',
  error: null,

  setSelectedModel: (model: string) => {
    localStorage.setItem('sigma-selected-model', model);
    set({ selectedModel: model });
  },

  loadConversations: async () => {
    try {
      const conversations = await fetchConversations();
      set({ conversations });
    } catch {
      // not authenticated yet
    }
  },

  loadConversation: async (id: string) => {
    try {
      const conv = await fetchConversation(id);
      if (conv?.messages) {
        set({ messages: conv.messages, activeConversationId: id });
      }
    } catch {
      set({ error: 'Failed to load conversation' });
    }
  },

  sendMessage: async (content: string, mode?: string, attachments?: Attachment[]) => {
    const { selectedModel, activeConversationId, messages } = get();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId || '',
      role: 'user',
      content,
      model: selectedModel,
      created_at: new Date().toISOString(),
      attachments,
    };

    const updatedMessages = [...messages, userMessage];
    set({ messages: updatedMessages, isStreaming: true, streamedContent: '', error: null });

    try {
      const apiMessages = updatedMessages.map((m) => {
        const atts = m === userMessage ? attachments : undefined;
        return { role: m.role, content: buildContentParts(m.content, atts) };
      });

      streamController = await streamChat(
        apiMessages,
        selectedModel,
        (chunk) => {
          set((state) => ({ streamedContent: state.streamedContent + chunk }));
        },
        (convId) => {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            conversation_id: convId,
            role: 'assistant',
            content: get().streamedContent,
            model: selectedModel,
            created_at: new Date().toISOString(),
          };
          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
            streamedContent: '',
            activeConversationId: convId,
          }));
          get().loadConversations();
        },
        (error) => {
          set({ isStreaming: false, error, streamedContent: '' });
        },
        activeConversationId || undefined,
        mode,
      );
    } catch (err: any) {
      set({ isStreaming: false, error: err.message, streamedContent: '' });
    }
  },

  createNewConversation: () => {
    set({ activeConversationId: null, messages: [], streamedContent: '', error: null });
  },

  deleteConversation: async (id: string) => {
    try {
      await apiDeleteConversation(id);
      const { conversations, activeConversationId } = get();
      set({
        conversations: conversations.filter((c) => c.id !== id),
      });
      if (activeConversationId === id) {
        set({ activeConversationId: null, messages: [] });
      }
    } catch {
      set({ error: 'Failed to delete conversation' });
    }
  },

  setActiveConversation: (id: string) => {
    set({ activeConversationId: id, messages: [] });
    get().loadConversation(id);
  },

  stopStreaming: () => {
    if (streamController) {
      streamController.abort();
      streamController = null;
    }
    set({ isStreaming: false });
  },

  clearError: () => set({ error: null }),
}));
