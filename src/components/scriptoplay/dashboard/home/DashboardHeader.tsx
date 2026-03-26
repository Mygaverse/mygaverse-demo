'use client';

import React, { useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import Button from '@/components/scriptoplay/ui/Button';

export default function DashboardHeader() {
  const tabs = ['All', 'AI Assistant', 'Your Plan', 'Team Members', 'Recent', 'Documents', 'Templates', 'Overview'];
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="border-b border-[#262626] -mx-6 px-6 bg-[#0a0a0a] pt-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">Dashboard</p>
          {/* We will hook this 'Alan' up to Supabase Auth later */}
          <h1 className="text-3xl font-bold text-white">Welcome, Alan.</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* <button className="bg-[#1a1a1a] hover:bg-[#262626] px-6 py-2.5 rounded-lg text-sm transition-colors border border-[#262626] text-white">
              My Scripts
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-600/20 text-white font-medium">
            <Icon icon={ICONS.plus} size={16} />
            <span>New</span>
          </button> */}
          <Button variant="secondary">
            My Scripts
          </Button>
          <Button variant="primary" icon={ICONS.plus}>
            New
          </Button>
        </div>
      </div>

      {/* Scrollable Tabs */}
      <div className="flex gap-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm transition-colors relative whitespace-nowrap ${activeTab === tab
                ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-600'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}