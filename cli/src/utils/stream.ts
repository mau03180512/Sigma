import { StreamChunk } from '../types.js';

export interface StreamCallbacks {
  onContent?: (text: string) => void;
  onConversationId?: (id: string) => void;
  onError?: (error: string) => void;
  onDone?: (conversationId: string) => void;
}

export function handleStreamChunk(
  chunk: StreamChunk,
  callbacks: StreamCallbacks
): void {
  if (chunk.error) {
    callbacks.onError?.(chunk.error);
    return;
  }

  if (chunk.done) {
    callbacks.onDone?.(chunk.conversationId || '');
    return;
  }

  if (chunk.content) {
    callbacks.onContent?.(chunk.content);
  }

  if (chunk.conversationId) {
    callbacks.onConversationId?.(chunk.conversationId);
  }
}
