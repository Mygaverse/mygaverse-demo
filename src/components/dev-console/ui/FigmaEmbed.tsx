'use client';

import { Figma } from 'lucide-react';

interface FigmaEmbedProps {
  embedUrl: string;
  title: string;
}

export function FigmaEmbed({ embedUrl, title }: FigmaEmbedProps) {
  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#2a2a3e] bg-[#0d0d1a] h-40 text-center px-4">
        <Figma size={20} className="text-slate-600" />
        <div>
          <p className="text-xs text-slate-500 font-medium">Figma Frame</p>
          <p className="text-[10px] text-slate-700 mt-0.5">{title}</p>
          <p className="text-[10px] text-slate-700 mt-2">
            Embed URL to be linked — Figma share → Embed → Copy iframe src
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[#1e1e2e]">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d1a] border-b border-[#1e1e2e]">
        <Figma size={12} className="text-violet-400" />
        <span className="text-xs text-slate-400 truncate">{title}</span>
      </div>
      <iframe
        src={embedUrl}
        allowFullScreen
        className="w-full h-64 bg-[#1e1e2e]"
        title={title}
      />
    </div>
  );
}
