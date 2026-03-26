'use client';

import type { ChainStep, ChainStepType } from '@/types/dev-console';

const STEP_STYLES: Record<
  ChainStepType,
  { color: string; bg: string; border: string; dot: string; label: string }
> = {
  input: {
    color: 'text-slate-300',
    bg: 'bg-[#0d0d1a]',
    border: 'border-[#1e1e2e]',
    dot: 'bg-slate-500',
    label: 'INPUT',
  },
  llm: {
    color: 'text-blue-300',
    bg: 'bg-blue-950/40',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    label: 'LLM',
  },
  transform: {
    color: 'text-violet-300',
    bg: 'bg-violet-950/40',
    border: 'border-violet-500/20',
    dot: 'bg-violet-500',
    label: 'TRANSFORM',
  },
  api: {
    color: 'text-amber-300',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    label: 'API',
  },
  output: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    label: 'OUTPUT',
  },
};

interface ChainOfThoughtProps {
  steps: ChainStep[];
}

export function ChainOfThought({ steps }: ChainOfThoughtProps) {
  if (steps.length === 0) {
    return (
      <p className="text-xs text-slate-600 italic text-center py-4">
        No chain defined for this scene.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-[#1e1e2e]" />

      <div className="space-y-2">
        {steps.map((step, i) => {
          const style = STEP_STYLES[step.type];
          return (
            <div key={step.id} className="relative flex gap-3">
              {/* Dot */}
              <div
                className={`relative z-10 mt-2.5 w-[10px] h-[10px] rounded-full shrink-0 ${style.dot}`}
              />

              {/* Content */}
              <div
                className={`flex-1 rounded-lg border p-2.5 ${style.bg} ${style.border}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-bold tracking-widest ${style.color} opacity-70`}
                  >
                    {String(i + 1).padStart(2, '0')} · {style.label}
                  </span>
                </div>
                <p className={`text-[11px] font-medium leading-tight ${style.color}`}>
                  {step.title}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
