'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function PlanUsage() {
  // 1. Mock Data Setup
  const totalWords = 50000;
  const usedWords = 32450;
  // Calculate percentage (0 to 1)
  const percentage = Math.min(Math.max(usedWords / totalWords, 0), 1); // Clamp between 0 and 1

  // 2. SVG Configuration
  // Radius of the arc. increasing this makes the line thinner relative to the container
  const radius = 100; 
  // A semi-circle's circumference is PI * r. 
  // PI * 100 ≈ 314.159. This is our "100%" length.
  const arcLength = Math.PI * radius; 
  
  // Calculate the offset: The amount of the line we need to *hide* to show the correct percentage.
  // If 0% is used, we hide all 314px (offset = 314).
  // If 100% is used, we hide 0px (offset = 0).
  const strokeDashoffset = arcLength - (arcLength * percentage);

  return (
    <div className="flex flex-col h-fit justify-between">
      <p className="text-sm text-gray-400 mb-6">
        You are currently on the <span className="text-white font-medium">Pro Plan</span>. 
        You have used <span className="text-white">{Math.round(percentage * 100)}%</span> of your monthly credits.
      </p>
      
      {/* Gauge Chart Container */}
      <div className="flex justify-center mb-2 mt-auto">
        <div className="relative w-64 h-32">
           {/* The SVG */}
           <svg 
             viewBox="0 0 236 118" 
             className="w-full h-full overflow-visible"
           >
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" /> {/* Purple-500 */}
                  <stop offset="100%" stopColor="#ec4899" /> {/* Pink-500 */}
                </linearGradient>
              </defs>

              {/* 1. Background Arc (The Gray Track) */}
              <path 
                d="M 18 118 A 100 100 0 0 1 218 118" 
                fill="none" 
                stroke="#262626" 
                strokeWidth="25" 
                strokeLinecap="butt" 
              />

              {/* 2. Foreground Arc (The Animated Gradient) */}
              <motion.path 
                d="M 18 118 A 100 100 0 0 1 218 118" 
                fill="none" 
                stroke="url(#gaugeGradient)" 
                strokeWidth="25" 
                strokeLinecap="butt"
                strokeDasharray={arcLength} // The total length of the line
                initial={{ strokeDashoffset: arcLength }} // Start completely hidden (empty)
                animate={{ strokeDashoffset: strokeDashoffset }} // Animate to the calculated value
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} // Smooth 1.5s animation
              />
           </svg>

           {/* 3. Text Overlay */}
           {/* Positioned absolutely at the bottom center to align with the arc's base */}
           <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end">
              <div className="text-3xl font-bold text-white leading-none mb-1">
                {usedWords.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Words Generated
              </div>
           </div>
        </div>
      </div>

      {/* Legend / Stats */}
      <div className="flex items-center justify-center gap-6 mb-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <span className="text-xs text-gray-400">Used ({Math.round(percentage * 100)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#262626]"></div>
          <span className="text-xs text-gray-400">Available ({((totalWords - usedWords) / 1000).toFixed(1)}k)</span>
        </div>
      </div>

      <div className="flex gap-3 mt-auto">
        <button className="flex-1 bg-[#0f0f0f] hover:bg-[#262626] border border-[#262626] rounded-lg py-2.5 text-xs font-medium transition-colors text-white">
          Details
        </button>
        <button className="flex-1 bg-white hover:bg-gray-200 text-black border border-white rounded-lg py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10">
          <Icon icon={ICONS.plus} size={14} className="text-black" />
          Add Credits
        </button>
      </div>
    </div>
  );
}