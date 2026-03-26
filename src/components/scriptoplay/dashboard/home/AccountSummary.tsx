'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

// 1. Tooltip Interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[]; 
  label?: string;
}

// 2. Custom Tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-[#262626] p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs mb-1 font-medium">{label}</p>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <p className="text-white font-bold text-sm">
                {payload[0].value?.toLocaleString()} <span className="text-gray-500 font-normal text-xs">words</span>
            </p>
        </div>
      </div>
    );
  }
  return null;
};

// Mock Data
const data = [
  { name: 'Mon', words: 2400 },
  { name: 'Tue', words: 1398 },
  { name: 'Wed', words: 8800 },
  { name: 'Thu', words: 3908 },
  { name: 'Fri', words: 4800 },
  { name: 'Sat', words: 3800 },
  { name: 'Sun', words: 4300 },
];

export default function AccountSummary() {
  const [timeRange, setTimeRange] = useState('7d');
  
  // FIX: Prevent hydration mismatch by ensuring component mounts before rendering chart
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="flex flex-col h-full">
      
      {/* 1. Top Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Hours Saved', val: '425', icon: ICONS.clock }, 
          { label: 'Documents', val: '142', icon: ICONS.fileText },
          { label: 'Chatbots', val: '3', icon: ICONS.bot },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] rounded-lg p-3 border border-transparent hover:border-[#262626] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* 2. Chart Header & Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
            <h4 className="text-base font-semibold text-white">Generation Activity</h4>
            <p className="text-xs text-gray-400">Words generated over time</p>
        </div>
        
        <div className="flex bg-[#141414] p-1 rounded-lg border border-[#262626]">
            {['7d', '30d', '3m'].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                        timeRange === range 
                        ? 'bg-[#262626] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {range.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      {/* 3. The Area Chart */}
      {/* FIX: Changed from flex-1 to fixed h-[250px] to ensure visibility */}
      <div className="w-full h-[250px] mt-auto -ml-4">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/> 
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              
              <XAxis 
                dataKey="name" 
                stroke="#525252" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              
              <YAxis 
                stroke="#525252" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              
              <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#525252', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              
              <Area 
                type="monotone" 
                dataKey="words" 
                stroke="#a855f7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWords)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          // Optional loading state while chart mounts
          <div className="w-full h-full animate-pulse bg-[#1a1a1a] rounded-lg" />
        )}
      </div>

    </div>
  );
}