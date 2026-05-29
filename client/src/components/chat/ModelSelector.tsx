import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MODELS } from '../../types';
import { ChevronDown } from 'lucide-react';

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selectedModel, setSelectedModel } = useChatStore();
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm text-sigma-text-primary glass-hover transition-all duration-200"
      >
        <span className="hidden sm:inline">{currentModel.label}</span>
        <span className="sm:hidden">{currentModel.label.split(' ')[0]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-sigma-text-secondary" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 glass rounded-xl p-1.5 z-50 shadow-xl shadow-black/20">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                selectedModel === model.id
                  ? 'bg-sigma-accent/10 text-sigma-accent'
                  : 'text-sigma-text-primary hover:bg-sigma-glass-border'
              }`}
            >
              <div className="text-left">
                <span>{model.label}</span>
                <p className="text-xs text-sigma-text-secondary mt-0.5">{model.bestFor}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sigma-accent/10 text-sigma-accent">
                {model.tag}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
