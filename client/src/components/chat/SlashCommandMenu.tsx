import { useEffect, useState, useRef } from 'react';
import { SLASH_COMMANDS, SlashCommand } from '../../types';

interface SlashCommandMenuProps {
  text: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ text, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().startsWith(text.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [text]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].command);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 glass rounded-xl p-1.5 shadow-xl shadow-black/20 z-50"
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
            i === selectedIndex
              ? 'bg-sigma-accent/10 text-sigma-accent'
              : 'text-sigma-text-primary hover:bg-sigma-glass-border'
          }`}
        >
          <span className="font-mono text-xs">{cmd.command}</span>
          <span className="text-xs text-sigma-text-secondary">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
}
