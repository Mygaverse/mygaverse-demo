'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/scriptoplay/ui/Icon';
import Badge from '@/components/scriptoplay/ui/Badge';
import { ICONS } from '@/config/scriptoplay/icons';
import FadeIn from '@/components/scriptoplay/ui/FadeIn';
import { motion, AnimatePresence } from 'framer-motion';


export default function EmptyStateDashboard () {
  return (
    <FadeIn>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Scriptoplay</h1>
        <p className="text-gray-400 text-lg">Your creative studio for AI-powered storytelling.</p>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 h-auto lg:h-[500px]">
        
        {/* --- LEFT COLUMN --- */}
        <div className="flex flex-col gap-6 h-full">
          
          {/* 1. SCRIPT BLENDER (Tall - 66%) */}
          <Link 
            href="/scriptoplay/dashboard/create" 
            className="group relative flex-1 overflow-hidden bg-[#141414] border border-[#262626] hover:border-gray-500 rounded-3xl p-8 transition-all hover:shadow-2xl hover:shadow-purple-900/20 flex flex-col justify-between"
          >
            {/* Background Motion: Spinning Blender Blades */}
            <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2, rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-pink-600/50 blur-xl rounded-full"
              />
            </div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-600/20">
                {/* Swapped Plus for Blender Icon */}
                <Icon icon={ICONS.blender} size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Script Blender</h2>
              <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
                Don't start from a blank page. Mix genres, characters, and settings to spark your next masterpiece.
              </p>
            </div>
            <div className="mt-8 font-medium text-white flex items-center gap-2 group-hover:gap-4 transition-all">
              Open Blender <Icon icon={ICONS.arrowRight} />
            </div>
          </Link>

          {/* 2. SCRIPT SCAN (Short - 33%) - SIBLING STYLE */}
          <div className="relative h-[200px] bg-[#0f0f0f] border border-[#262626] rounded-3xl p-8 overflow-hidden group cursor-not-allowed opacity-75 hover:opacity-100 transition-opacity flex flex-col justify-between">
            {/* Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                  <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 text-gray-500 group-hover:text-purple-500 transition-colors">
                    <Icon icon={ICONS.upload} size={24} />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">Script Scan</h2>
                    <Badge variant="neutral" className="bg-[#262626] text-gray-400 border-none">Coming Soon</Badge>
                  </div>
              </div>
            </div>
            
            <div className="relative z-10 font-medium text-gray-500 flex items-center gap-2">
                Analysis Tool <Icon icon={ICONS.lock} size={14} />
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN (SWAPPED) --- */}
        <div className="flex flex-col gap-6 h-full">

          

          {/* 4. DEMO PROJECTS (Short - 33%) - NOW SECONDARY */}
          <div className="group relative h-[200px] bg-[#141414] border border-[#262626] hover:border-gray-600 rounded-3xl p-8 transition-all cursor-pointer overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon icon={ICONS.fileText} size={140} />
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#262626] rounded-xl flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-[#333] transition-colors shrink-0">
                    <Icon icon={ICONS.play} size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Explore Demos</h2>
                  <p className="text-gray-400 text-xs">View generated pilot episodes.</p>
                </div>
            </div>
          </div>

          {/* 3. WORKSPACE (Tall - 66%) - NOW PRIMARY */}
          <Link 
            href="/scriptoplay/dashboard/workspace" 
            className="group relative flex-1 bg-gradient-to-br from-[#141414] to-[#1a1a1a] border border-[#262626] hover:border-gray-500 rounded-3xl p-8 overflow-hidden transition-all hover:shadow-xl flex flex-col justify-between"
          >
            <div className="absolute right-8 top-8 w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Icon icon={ICONS.edit} size={32} />
            </div>

            <div className="relative z-10 max-w-md">
                <h2 className="text-2xl font-bold text-white mb-3">Have a storyline?</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Jump straight into the editor. Use our AI Co-pilot to flesh out scenes, generate dialogue, or format your existing notes into a professional script.
                </p>
            </div>
            
            <div className="relative z-10 font-bold text-blue-400 group-hover:text-white transition-colors flex items-center gap-2 group-hover:gap-4">
                Go to Workspace <Icon icon={ICONS.arrowRight} />
            </div>
          </Link>

        </div>
      </div>

    </FadeIn>
  );
};