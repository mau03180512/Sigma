import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import { CodeBlock } from './CodeBlock';
import { Shield, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-sigma-accent/20' : 'bg-sigma-accent/10'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-sigma-accent" />
        ) : (
          <Shield className="w-4 h-4 text-sigma-accent" />
        )}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-sigma-accent text-white rounded-tr-md'
            : 'glass rounded-tl-md'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (match) {
                      return <CodeBlock language={match[1]} code={codeString} />;
                    }
                    return (
                      <code className="bg-sigma-code/50 px-1.5 py-0.5 rounded text-sm font-mono text-sigma-accent" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-sigma-text-secondary">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.model && (
            <span className="text-[10px] text-sigma-text-secondary">
              {message.model.split('/').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-sigma-accent/10 flex items-center justify-center">
        <Shield className="w-4 h-4 text-sigma-accent" />
      </div>
      <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
