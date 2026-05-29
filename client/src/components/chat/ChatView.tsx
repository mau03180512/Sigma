import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Shield, Menu } from 'lucide-react';

export function ChatView() {
  const { messages, isStreaming, streamedContent, error, clearError } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {!hasMessages && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-2xl bg-sigma-accent/10 flex items-center justify-center mb-6 glow">
                <Shield className="w-10 h-10 text-sigma-accent" />
              </div>
              <h2 className="text-2xl font-bold text-sigma-text-primary mb-2">Sigma</h2>
              <p className="text-sigma-text-secondary mb-8 max-w-md">
                Elite AI assistant for hackers, developers, and security researchers.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { cmd: '/ctf', desc: 'CTF challenge solving' },
                  { cmd: '/audit', desc: 'Security code review' },
                  { cmd: '/pentest', desc: 'Pentesting methodology' },
                  { cmd: '/explain', desc: 'Explain concepts' },
                ].map((item) => (
                  <button
                    key={item.cmd}
                    onClick={() => {
                      const input = document.querySelector('textarea');
                      if (input) {
                        input.value = item.cmd + ' ';
                        input.focus();
                      }
                    }}
                    className="glass glass-hover rounded-xl p-4 text-left transition-all duration-200"
                  >
                    <code className="text-sigma-accent text-sm font-mono">{item.cmd}</code>
                    <p className="text-xs text-sigma-text-secondary mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {streamedContent && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    conversation_id: '',
                    role: 'assistant',
                    content: streamedContent,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}

              {isStreaming && !streamedContent && <TypingIndicator />}

              {error && (
                <div className="glass rounded-xl p-4 border border-sigma-danger/30 animate-fade-in">
                  <p className="text-sm text-sigma-danger">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-xs text-sigma-text-secondary hover:text-sigma-text-primary mt-2 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
