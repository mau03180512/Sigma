import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SlashCommand, SLASH_COMMANDS, MODELS } from '../../types';
import { Send, Square } from 'lucide-react';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandText, setCommandText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    let mode: string | undefined;
    let content = trimmed;

    const cmd = SLASH_COMMANDS.find((c) => trimmed.startsWith(c.command));
    if (cmd) {
      mode = cmd.command;
      content = trimmed.slice(cmd.command.length).trim();
    }

    // auto-select model based on slash command
    if (mode === '/ir' || mode === '/malware') {
      setSelectedModel('llama-3.3-70b-versatile');
    } else if (mode === '/explain' || mode === '/audit') {
      setSelectedModel('deepseek-r1-distill-llama-70b');
    } else if (mode === '/build') {
      setSelectedModel('mixtral-8x7b-32768');
    } else {
      setSelectedModel(MODELS[0].id);
    }

    sendMessage(content || trimmed, mode);
    setInput('');
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
              className="w-full bg-sigma-bg-secondary border border-sigma-glass-border rounded-xl pl-4 pr-4 py-3 text-sm text-sigma-text-primary placeholder:text-sigma-text-secondary focus:outline-none focus:border-sigma-accent transition-colors resize-none max-h-[200px]"
              disabled={isStreaming}
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
              disabled={!input.trim()}
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
