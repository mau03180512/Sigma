import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-sigma-glass-border">
      <div className="flex items-center justify-between px-4 py-2 bg-sigma-code/50 border-b border-sigma-glass-border">
        <span className="text-xs text-sigma-text-secondary font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-sigma-text-secondary hover:text-sigma-text-primary transition-colors"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-sigma-success" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={code.split('\n').length > 3}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'var(--sigma-code-bg)',
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
