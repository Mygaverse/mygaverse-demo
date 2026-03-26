'use client';

import { useDevConsoleStore } from '@/store/devConsoleStore';
import { SystemPromptCard } from '../ui/SystemPromptCard';
import { ChainOfThought } from '../ui/ChainOfThought';
import { Brain } from 'lucide-react';

export function IntelligencePanel() {
  const { currentScene } = useDevConsoleStore();
  if (!currentScene) return null;
  const { intelligence } = currentScene;

  return (
    <div className="space-y-5">
      {/* Note / global hint */}
      {intelligence.note && (
        <div className="flex gap-2 rounded-lg border border-blue-500/20 bg-blue-950/30 p-3">
          <Brain size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-300/80 leading-relaxed">{intelligence.note}</p>
        </div>
      )}

      {/* System Prompts */}
      {intelligence.systemPrompts.length > 0 && (
        <section>
          <SectionLabel>System Prompts</SectionLabel>
          <div className="space-y-2">
            {intelligence.systemPrompts.map((prompt, i) => (
              <SystemPromptCard key={i} prompt={prompt} />
            ))}
          </div>
        </section>
      )}

      {/* Chain of Thought */}
      {intelligence.chainOfThought.length > 0 && (
        <section>
          <SectionLabel>Chain of Thought</SectionLabel>
          <ChainOfThought steps={intelligence.chainOfThought} />
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
