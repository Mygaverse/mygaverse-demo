'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface CodeBlockProps {
  label: string;
  language: string;
  code: string;
  githubUrl?: string;
  layer: 'frontend' | 'backend' | 'database' | 'ai';
}

const LAYER_STYLES: Record<CodeBlockProps['layer'], { label: string; color: string }> = {
  frontend: { label: 'Frontend', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  backend: { label: 'Backend', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  database: { label: 'Database', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  ai: { label: 'AI', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
};

export function CodeBlock({ label, language, code, githubUrl, layer }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available in some contexts
    }
  };

  const layerStyle = LAYER_STYLES[layer];
  const lines = code.split('\n');

  return (
    <div className="rounded-lg border border-[#1e1e2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d0d1a] border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${layerStyle.color}`}
          >
            {layerStyle.label}
          </span>
          <span className="text-xs text-slate-300 font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className="text-[10px] text-slate-600 mr-1">{language}</span>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
              title="View on GitHub"
            >
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto bg-[#060609]">
        <pre className="p-3 text-[11px] leading-5 font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-slate-700 w-6 shrink-0 text-right mr-3 tabular-nums">
                {i + 1}
              </span>
              <span className="text-slate-300 whitespace-pre">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
