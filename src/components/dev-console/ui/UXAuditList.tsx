'use client';

import type { UXAuditPoint } from '@/types/dev-console';

const CATEGORY_ICON: Record<UXAuditPoint['category'], string> = {
  layout: '⬛',
  accessibility: '♿',
  performance: '⚡',
  interaction: '👆',
  visual: '🎨',
};

const IMPACT_STYLES: Record<UXAuditPoint['impact'], string> = {
  high: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

interface UXAuditListProps {
  points: UXAuditPoint[];
}

export function UXAuditList({ points }: UXAuditListProps) {
  if (points.length === 0) {
    return (
      <p className="text-xs text-slate-600 italic text-center py-4">
        No audit points for this scene.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {points.map((point) => (
        <div
          key={point.id}
          className="rounded-lg border border-[#1e1e2e] bg-[#0d0d1a] p-3 space-y-1.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">{CATEGORY_ICON[point.category]}</span>
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {point.title}
              </span>
            </div>
            <span
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${IMPACT_STYLES[point.impact]}`}
            >
              {point.impact}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{point.description}</p>
        </div>
      ))}
    </div>
  );
}
