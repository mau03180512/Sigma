import { create } from 'zustand';
import { Message, Conversation } from '../types';
import { streamChat, getConversations as fetchConversations, deleteConversation as apiDeleteConversation } from '../lib/api';

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
  sendMessage: (content: string, mode?: string) => Promise<void>;
  createNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
  stopStreaming: () => void;
  clearError: () => void;
}

let streamController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  selectedModel: localStorage.getItem('sigma-selected-model') || 'deepseek-chat',
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
      const conv = await fetchConversations();
      const fullConv = conv.find((c: any) => c.id === id);
      if (fullConv?.messages) {
        set({ messages: fullConv.messages, activeConversationId: id });
      }
    } catch {
      set({ error: 'Failed to load conversation' });
    }
  },

  sendMessage: async (content: string, mode?: string) => {
    const { selectedModel, activeConversationId, messages } = get();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId || '',
      role: 'user',
      content,
      model: selectedModel,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    set({ messages: updatedMessages, isStreaming: true, streamedContent: '', error: null });

    try {
      streamController = await streamChat(
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
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
