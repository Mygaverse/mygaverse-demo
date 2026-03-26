'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import type { SystemPrompt } from '@/types/dev-console';

interface SystemPromptCardProps {
  prompt: SystemPrompt;
}

export function SystemPromptCard({ prompt }: SystemPromptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = prompt.content.slice(0, 120).replace(/\n/g, ' ');

  return (
    <div className="rounded-lg border border-[#1e1e2e] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-2 px-3 py-2.5 bg-[#0d0d1a] hover:bg-[#111124] transition-colors text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Cpu size={11} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold text-blue-400 tracking-wider">
              SYSTEM PROMPT
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200">{prompt.label}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Model: {prompt.model}</p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {/* Preview / Full content */}
      <div className="bg-[#060609] border-t border-[#1e1e2e]">
        {expanded ? (
          <pre className="p-3 text-[11px] font-mono text-blue-200/80 whitespace-pre-wrap leading-relaxed">
            {prompt.content}
          </pre>
        ) : (
          <p className="p-3 text-[11px] text-slate-600 font-mono leading-relaxed line-clamp-2">
            {preview}
            {prompt.content.length > 120 && (
              <span className="text-slate-700"> …click to expand</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
