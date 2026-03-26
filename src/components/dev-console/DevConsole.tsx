'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Code2,
  Brain,
  X,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { useDevConsoleStore } from '@/store/devConsoleStore';
import { getSceneForPath } from '@/lib/dev-console/scene-registry';
import type { ConsoleTab } from '@/types/dev-console';
import { DesignPanel } from './panels/DesignPanel';
import { EngineeringPanel } from './panels/EngineeringPanel';
import { IntelligencePanel } from './panels/IntelligencePanel';

const SIDEBAR_WIDTH = 420;

const TABS: { id: ConsoleTab; label: string; Icon: React.ElementType; color: string }[] = [
  { id: 'design', label: 'Design', Icon: Palette, color: 'text-violet-400' },
  { id: 'engineering', label: 'Engineering', Icon: Code2, color: 'text-emerald-400' },
  { id: 'intelligence', label: 'Intelligence', Icon: Brain, color: 'text-blue-400' },
];

const PRODUCT_BADGE: Record<string, { label: string; color: string }> = {
  scriptoplay: { label: 'Scriptoplay', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  bqool: { label: 'BQool', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  global: { label: 'Overview', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
};

export function DevConsole() {
  const pathname = usePathname();
  const { isOpen, toggle, close, activeTab, setActiveTab, currentScene, setCurrentScene } =
    useDevConsoleStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update scene whenever route changes
  useEffect(() => {
    const scene = getSceneForPath(pathname);
    setCurrentScene(scene);
    // Reset scroll
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pathname, setCurrentScene]);

  const badge = currentScene ? PRODUCT_BADGE[currentScene.product] : PRODUCT_BADGE.global;

  return (
    <>
      {/* Pull Tab — visible when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="pull-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={toggle}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1.5 w-9 py-5 rounded-l-xl bg-[#0f0f18] border border-r-0 border-[#1e1e2e] shadow-xl cursor-pointer hover:bg-[#161628] transition-colors group"
          >
            <Terminal size={14} className="text-blue-400" />
            <span
              className="text-[9px] font-bold text-slate-500 tracking-widest group-hover:text-slate-300 transition-colors"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              DEV
            </span>
            <ChevronLeft size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? SIDEBAR_WIDTH : 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed right-0 top-0 h-screen z-50 overflow-hidden"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div
          className="h-full flex flex-col bg-[#0a0a0f] border-l border-[#1e1e2e] shadow-2xl"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="shrink-0 border-b border-[#1e1e2e] bg-[#0f0f18]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal size={14} className="text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 tracking-wide">
                  DEV CONSOLE
                </span>
                {badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <button
                onClick={close}
                className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-[#1e1e2e] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scene subtitle */}
            {currentScene && (
              <div className="px-4 pb-3">
                <p className="text-[10px] text-slate-600 leading-tight">
                  <span className="text-slate-500 font-medium">{currentScene.title}</span>
                  {currentScene.subtitle && (
                    <>
                      <span className="mx-1 text-slate-700">›</span>
                      {currentScene.subtitle}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex">
              {TABS.map(({ id, label, Icon, color }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors ${
                      active
                        ? `${color} border-current bg-transparent`
                        : 'text-slate-600 border-transparent hover:text-slate-400'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Scrollable Content ────────────────────────────────────── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            {activeTab === 'design' && <DesignPanel />}
            {activeTab === 'engineering' && <EngineeringPanel />}
            {activeTab === 'intelligence' && <IntelligencePanel />}
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-[#1e1e2e] px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-700">
              demo.mygaverse.com · Director&apos;s Commentary
            </span>
            <button
              onClick={close}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              <ChevronRight size={11} />
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
