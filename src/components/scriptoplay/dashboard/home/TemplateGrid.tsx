import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function TemplateGrid() {
  const templates = [
    { name: 'Email Generator', icon: ICONS.mail, color: 'bg-gray-700', text: 'text-gray-300' },
    { name: 'Resume Builder', icon: ICONS.fileText, color: 'bg-gray-700', text: 'text-gray-300' },
    { name: 'Event Planner', icon: ICONS.calendar, color: 'bg-gray-700', text: 'text-gray-300' },
    { name: 'Blog Article', icon: ICONS.edit, color: 'bg-yellow-600', text: 'text-white' },
    { name: 'Marketing Plan', icon: ICONS.trending, color: 'bg-blue-600', text: 'text-white' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4 cursor-pointer">
      {templates.map((t) => (
        <div key={t.name} className="flex flex-col items-center text-center p-5 bg-[#0f0f0f] rounded-xl hover:bg-[#141414] border border-transparent hover:border-[#262626] transition-colors cursor-pointer group">
            <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center shrink-0 mb-3 group-hover:scale-110 transition-transform`}>
                <Icon icon={t.icon} size={24} className={t.text} />
            </div>
            <h4 className="text-sm font-medium text-white mb-2">{t.name}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">Generate content for {t.name} automatically.</p>
        </div>
      ))}
    </div>
  );
}