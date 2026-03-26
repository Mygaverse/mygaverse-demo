'use client';

import { useDevConsoleStore } from '@/store/devConsoleStore';
import { CodeBlock } from '../ui/CodeBlock';

const CATEGORY_COLORS: Record<string, string> = {
  framework: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  ai: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  database: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  infra: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  ui: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export function EngineeringPanel() {
  const { currentScene } = useDevConsoleStore();
  if (!currentScene) return null;
  const { engineering } = currentScene;

  return (
    <div className="space-y-5">
      {/* Tech Stack */}
      {engineering.techStack.length > 0 && (
        <section>
          <SectionLabel>Tech Stack</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {engineering.techStack.map((tech) => (
              <span
                key={tech.name}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  CATEGORY_COLORS[tech.category] ?? CATEGORY_COLORS.ui
                }`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Architecture Note */}
      {engineering.architectureNote && (
        <section>
          <SectionLabel>Architecture</SectionLabel>
          <p className="text-[11px] text-slate-500 leading-relaxed rounded-lg border border-[#1e1e2e] bg-[#0d0d1a] p-3">
            {engineering.architectureNote}
          </p>
        </section>
      )}

      {/* Code Snippets */}
      {engineering.snippets.length > 0 && (
        <section>
          <SectionLabel>Code Snippets</SectionLabel>
          <div className="space-y-3">
            {engineering.snippets.map((snippet, i) => (
              <CodeBlock key={i} {...snippet} />
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
