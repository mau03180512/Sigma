import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import { CodeBlock } from './CodeBlock';
import { Shield, User, File, Download } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const attachments = message.attachments;
  const images = attachments?.filter((a) => a.type.startsWith('image/')) || [];
  const otherFiles = attachments?.filter((a) => !a.type.startsWith('image/')) || [];

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
          {images.length > 0 && (
            <div className={`grid gap-2 mb-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {images.map((img) => (
                <div key={img.id} className="rounded-lg overflow-hidden bg-black/20">
                  <img src={img.dataUrl} alt={img.name} className="w-full h-auto max-h-64 object-contain" />
                </div>
              ))}
            </div>
          )}

          {otherFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {otherFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                  <File className="w-3.5 h-3.5 text-sigma-accent" />
                  <span className="text-sigma-text-primary truncate max-w-[120px]">{f.name}</span>
                  <span className="text-sigma-text-secondary">{formatSize(f.size)}</span>
                  {f.dataUrl && (
                    <a href={f.dataUrl} download={f.name} className="p-0.5 rounded hover:bg-sigma-glass-border">
                      <Download className="w-3 h-3 text-sigma-accent" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

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
          {attachments && attachments.length > 0 && (
            <span className="text-[10px] text-sigma-text-secondary">{attachments.length} file{attachments.length > 1 ? 's' : ''}</span>
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
