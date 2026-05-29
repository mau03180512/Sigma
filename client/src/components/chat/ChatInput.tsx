import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SlashCommand, SLASH_COMMANDS, MODELS, Attachment } from '../../types';
import { Send, Square, Paperclip, X, File, Image as ImageIcon } from 'lucide-react';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isStreaming, stopStreaming, setSelectedModel } = useChatStore();

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
      setSelectedModel('deepseek-r1-distill-llama-70b');
    } else if (mode === '/build') {
      setSelectedModel('mixtral-8x7b-32768');
    } else {
      setSelectedModel(MODELS[0].id);
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
    <div className="border-t border-sigma-glass-border bg-sigma-bg-primary/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm max-w-[200px]">
                {att.type.startsWith('image/') ? (
                  <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                    <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <File className="w-4 h-4 text-sigma-accent shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-sigma-text-primary truncate">{att.name}</p>
                  <p className="text-[10px] text-sigma-text-secondary">{formatSize(att.size)}</p>
                </div>
                <button onClick={() => removeAttachment(att.id)} className="shrink-0 p-0.5 rounded hover:bg-sigma-glass-border transition-colors">
                  <X className="w-3 h-3 text-sigma-text-secondary" />
                </button>
              </div>
            ))}
            {attachments.length >= 20 && (
              <span className="text-[10px] text-sigma-text-secondary self-center">Max 20 files</span>
            )}
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            {showCommands && (
              <SlashCommandMenu
                text={commandText}
                onSelect={handleCommandSelect}
                onClose={() => setShowCommands(false)}
              />
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sigma anything... (type / for commands)"
              rows={1}
              className="w-full bg-sigma-bg-secondary border border-sigma-glass-border rounded-xl pl-10 pr-4 py-3 text-sm text-sigma-text-primary placeholder:text-sigma-text-secondary focus:outline-none focus:border-sigma-accent transition-colors resize-none max-h-[200px]"
              disabled={isStreaming}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || attachments.length >= 20}
              className="absolute left-3 bottom-2.5 p-1 rounded-md text-sigma-text-secondary hover:text-sigma-accent hover:bg-sigma-glass-border transition-all disabled:opacity-30"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.json,.js,.ts,.py,.html,.css,.md,.xml,.yaml,.yml,.sh,.sql,.log"
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="shrink-0 p-3 rounded-xl bg-sigma-danger/20 text-sigma-danger hover:bg-sigma-danger/30 transition-all duration-200"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() && !attachments.length}
              className="shrink-0 p-3 rounded-xl bg-sigma-accent text-white hover:bg-sigma-accent-glow transition-all duration-200 glow-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
