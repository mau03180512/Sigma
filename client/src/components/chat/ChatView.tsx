import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Shield, Sparkles, Zap, Code, Search } from 'lucide-react';

export function ChatView() {
  const { messages, isStreaming, streamedContent, error, clearError } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamedContent]);

  const scrollToBottom = () => {
    userScrolledUp.current = false;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-sigma-bg-primary relative">
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        {userScrolledUp.current && (
          <button onClick={scrollToBottom} className="sticky bottom-0 left-1/2 -translate-x-1/2 z-10 mb-2 glass rounded-full px-4 py-2 text-xs text-sigma-accent hover:bg-sigma-accent/10 transition-all shadow-lg animate-fade-in">
            ↓ New messages
          </button>
        )}
        <div className="max-w-4xl mx-auto space-y-8">
          {!hasMessages && !isStreaming ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-sigma-accent/10 flex items-center justify-center animate-pulse-ring">
                  <Shield className="w-12 h-12 text-sigma-accent" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-sigma-bg-secondary border border-sigma-glass-border flex items-center justify-center shadow-xl">
                  <Sparkles className="w-4 h-4 text-sigma-accent-glow" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-sigma-text-primary mb-3 tracking-tight">
                System Online
              </h2>
              <p className="text-sigma-text-secondary mb-10 max-w-lg leading-relaxed">
                Welcome to Sigma. Your elite neural interface for advanced security research, 
                code architecture, and mission-critical automation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { cmd: '/audit', desc: 'Secure Code Analysis', icon: Shield, color: 'text-sigma-accent' },
                  { cmd: '/build', desc: 'Rapid Prototyping', icon: Zap, color: 'text-amber-400' },
                  { cmd: '/explain', desc: 'Neural Concept Mapping', icon: Code, color: 'text-sigma-success' },
                  { cmd: '/ctf', desc: 'Security Intelligence', icon: Search, color: 'text-sigma-danger' },
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
                    className="group glass glass-hover rounded-2xl p-5 text-left transition-all duration-300 hover:translate-y-[-4px] border-sigma-glass-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-sigma-bg-secondary group-hover:bg-sigma-accent/10 transition-colors ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <code className="text-sigma-text-primary text-sm font-bold font-mono group-hover:text-sigma-accent transition-colors">
                          {item.cmd}
                        </code>
                        <p className="text-xs text-sigma-text-secondary mt-1 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {messages.map((msg, idx) => {
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const msgDate = new Date(msg.created_at).toDateString();
                const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                const showDateSep = msgDate !== prevDate;
                return (
                  <div key={msg.id}>
                    {showDateSep && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-sigma-glass-border" />
                        <span className="text-[10px] font-medium text-sigma-text-secondary uppercase tracking-widest shrink-0">
                          {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 h-px bg-sigma-glass-border" />
                      </div>
                    )}
                    <MessageBubble message={msg} />
                  </div>
                );
              })}

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
                <div className="glass rounded-2xl p-4 border border-sigma-danger/30 animate-fade-in bg-sigma-danger/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sigma-danger/20">
                      <Zap className="w-4 h-4 text-sigma-danger" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-sigma-text-primary">System Error</p>
                      <p className="text-xs text-sigma-text-secondary mt-0.5">{error}</p>
                    </div>
                    <button
                      onClick={clearError}
                      className="px-3 py-1.5 rounded-lg bg-sigma-glass-border hover:bg-sigma-glass-border/80 text-xs font-bold text-sigma-text-primary transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="relative z-20">
        <div className="absolute bottom-full left-0 right-0 h-24 bg-gradient-to-t from-sigma-bg-primary to-transparent pointer-events-none" />
        <ChatInput />
      </div>
    </div>
  );
}
