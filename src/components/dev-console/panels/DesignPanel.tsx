'use client';

import { useDevConsoleStore } from '@/store/devConsoleStore';
import { FigmaEmbed } from '../ui/FigmaEmbed';
import { UXAuditList } from '../ui/UXAuditList';
import { ScanEye } from 'lucide-react';

export function DesignPanel() {
  const { currentScene, uxAuditActive, toggleUXAudit } = useDevConsoleStore();
  if (!currentScene) return null;
  const { design } = currentScene;

  return (
    <div className="space-y-5">
      {/* Figma Embed */}
      {design.figmaFrame !== undefined && (
        <section>
          <SectionLabel>Figma Frame</SectionLabel>
          <FigmaEmbed
            embedUrl={design.figmaFrame.embedUrl}
            title={design.figmaFrame.title}
          />
        </section>
      )}

      {/* UX Audit */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>UX Audit</SectionLabel>
          <button
            onClick={toggleUXAudit}
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border transition-colors ${
              uxAuditActive
                ? 'text-violet-300 bg-violet-500/10 border-violet-500/30'
                : 'text-slate-500 bg-transparent border-[#1e1e2e] hover:border-slate-600'
            }`}
          >
            <ScanEye size={11} />
            {uxAuditActive ? 'Audit ON' : 'Audit OFF'}
          </button>
        </div>
        <UXAuditList points={design.uxAuditPoints} />
      </section>

      {/* Design Decisions */}
      {design.designDecisions.length > 0 && (
        <section>
          <SectionLabel>Design Decisions</SectionLabel>
          <div className="space-y-2">
            {design.designDecisions.map((d, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#1e1e2e] bg-[#0d0d1a] p-3"
              >
                <p className="text-xs font-semibold text-violet-300 mb-1">{d.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{d.rationale}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase mb-2">
      {children}
    </p>
  );
}
