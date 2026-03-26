'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
//import GeneratorWizard from '@/components/scriptoplay/dashboard/wizard/GeneratorWizard';
import ScriptBlender from '@/components/scriptoplay/dashboard/tools/ScriptBlender';

export default function CreateScriptPage() {
  return (
    <div className="h-full w-full flex flex-col p-6 bg[#0a0a0a] overflow-hidden relative">
      {/* 1. Simple Header for this specific flow */}
      <div className="flex items-center gap-4 mb-6 shrink-0 z-10">
        <Link 
          href="/scriptoplay/dashboard" 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
        >
          <Icon icon={ICONS.chevronLeft} size={20} />
        </Link>
        <div>
           <h1 className="text-xl font-bold text-white">New Script Project</h1>
           <p className="text-xs text-gray-500">AI-Powered Idea Generator</p>
        </div>
      </div>

      {/* 2. Render the Wizard Component */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto bg-[#0f0f0f] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="h-full w-full">
            <ScriptBlender />
         </div>
      </div>
      {/* Background decoration to make it look "floating" */}
      <div className="absolute inset-0 bg-purple-900/5 pointer-events-none z-0" />
    </div>
  );
}