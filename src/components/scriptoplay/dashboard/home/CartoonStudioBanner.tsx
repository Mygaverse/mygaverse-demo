import React from 'react';
import Link from 'next/link';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import Image from 'next/image';

export default function CartoonStudioBanner() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#262626] group shadow-2xl shadow-purple-900/20">

      {/* 1. Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/cartoon-studio-characters.png"
          alt="Cartoon Studio"
          fill
          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Gradient Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
      </div>

      {/* 2. Content */}
      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-xs font-bold text-purple-200 tracking-wide uppercase">New Feature</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-sm">
            Scriptoplay <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">Cartoon Studio</span>
          </h1>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-lg font-medium drop-shadow-md">
            The all-in-one animation pipeline. Create specific visual styles, manage character assets, and auto-generate production-ready scripts from a single idea.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/scriptoplay/dashboard/create-cartoon" className="bg-white text-black hover:bg-gray-100 px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:-translate-y-1">
              <Icon icon={ICONS.sparkles} size={20} className="text-purple-600" />
              <span>Launch Studio</span>
            </Link>
            <div className="px-6 py-3.5 rounded-xl text-sm font-semibold text-gray-400 border border-white/10 bg-black/20 backdrop-blur-sm flex items-center gap-3">
              <span className="flex items-center gap-1"><Icon icon={ICONS.image} size={14} /> Asset Vault</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="flex items-center gap-1"><Icon icon={ICONS.fileText} size={14} /> Beat Sheets</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
