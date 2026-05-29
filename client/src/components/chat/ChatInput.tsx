import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SlashCommand, SLASH_COMMANDS, MODELS, Attachment } from '../../types';
import { Send, Square, Paperclip, X, File, Image as ImageIcon, Cpu } from 'lucide-react';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isStreaming, stopStreaming, setSelectedModel, selectedModel } = useChatStore();

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleInput = (value: string) => {
    setInput(value);
    if (value.startsWith('/')) {
      const text = value.slice(1).split(' ')[0];
      setCommandText('/' + text);
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (command: SlashCommand) => {
    setInput(command + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => {
      const combined = [...prev, ...files.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type,
        size: f.size,
        dataUrl: URL.createObjectURL(f),
      }))];
      return combined.slice(0, 20);
    });
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachments.length) || isStreaming) return;

    let mode: string | undefined;
    let content = trimmed;

    const cmd = SLASH_COMMANDS.find((c) => trimmed.startsWith(c.command));
    if (cmd) {
      mode = cmd.command;
      content = trimmed.slice(cmd.command.length).trim();
    }

    // auto-select model
    const hasImages = attachments.some((a) => a.type.startsWith('image/'));
    if (hasImages) {
      setSelectedModel('llama-3.2-90b-vision-preview');
    } else if (mode === '/explain' || mode === '/audit') {
      setSelectedModel('mixtral-8x7b-32768');
    } else if (mode === '/build') {
      setSelectedModel('mixtral-8x7b-32768');
    } else {
      // Don't change if already selected
    }

    sendMessage(content || trimmed, mode, attachments.length ? attachments : undefined);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-sigma-bg-primary/80 backdrop-blur-xl border-t border-sigma-glass-border pb-safe">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 animate-slide-up">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 glass bg-sigma-bg-secondary/50 rounded-xl p-2 pr-3 text-sm border-sigma-accent/20">
                {att.type.startsWith('image/') ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-sigma-glass-border">
                    <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-sigma-accent/10 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-sigma-accent" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-sigma-text-primary truncate">{att.name}</p>
                  <p className="text-[10px] text-sigma-text-secondary font-medium uppercase">{formatSize(att.size)}</p>
                </div>
                <button 
                  onClick={() => removeAttachment(att.id)} 
                  className="shrink-0 p-1.5 rounded-lg hover:bg-sigma-danger/20 text-sigma-text-secondary hover:text-sigma-danger transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-3 glass bg-sigma-bg-secondary/30 rounded-2xl p-2 border-sigma-glass-border focus-within:border-sigma-accent/50 focus-within:ring-4 focus-within:ring-sigma-accent/5 transition-all duration-300">
          <div className="flex-1 relative flex items-end">
            {showCommands && (
              <SlashCommandMenu
                text={commandText}
                onSelect={handleCommandSelect}
                onClose={() => setShowCommands(false)}
              />
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || attachments.length >= 20}
              className="p-3 rounded-xl text-sigma-text-secondary hover:text-sigma-accent hover:bg-sigma-accent/10 transition-all disabled:opacity-30 shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sigma anything... (type / for commands)"
              rows={1}
              className="w-full bg-transparent border-none py-3 px-1 text-sm text-sigma-text-primary placeholder:text-sigma-text-secondary/60 focus:outline-none resize-none max-h-[200px] custom-scrollbar min-h-[44px]"
              disabled={isStreaming}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.json,.js,.ts,.py,.html,.css,.md,.xml,.yaml,.yml,.sh,.sql,.log"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-2 pr-1 pb-1">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="shrink-0 p-3 rounded-xl bg-sigma-danger/20 text-sigma-danger hover:bg-sigma-danger/30 transition-all duration-200 flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && !attachments.length}
                className="shrink-0 p-3 rounded-xl bg-sigma-accent text-white hover:bg-sigma-accent-glow transition-all duration-300 glow-hover disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-sigma-accent/20 group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:translate-y-[-2px] transition-transform" />
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sigma-success animate-pulse" />
              <span className="text-[10px] font-bold text-sigma-text-secondary uppercase tracking-widest">Neural Link Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-sigma-accent" />
              <span className="text-[10px] font-bold text-sigma-text-secondary uppercase tracking-widest">{currentModel.label}</span>
            </div>
          </div>
          <p className="text-[10px] text-sigma-text-secondary font-medium">
            Press <kbd className="bg-sigma-glass-border px-1 rounded text-sigma-text-primary">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  );
}
