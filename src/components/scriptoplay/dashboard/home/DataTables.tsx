'use client';

import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon'; // Ensure this path is correct
import { ICONS } from '@/config/scriptoplay/icons';   // Ensure this path is correct

// 1. Definition of what a "Row" looks like
interface TableItem {
  id: string | number;
  name: string;
  type: string;
  status: 'published' | 'draft' | 'scheduled';
  date: string;
  icon: string; // The icon string from your ICONS config
}

// 2. Mock Data (You will eventually pass this in as props)
const recentItems: TableItem[] = [
  { 
    id: 1, 
    name: 'SEO Article: "AI Trends in 2025"', 
    type: 'Article Generator', 
    status: 'published', 
    date: '2 hours ago',
    icon: ICONS.fileText 
  },
  { 
    id: 2, 
    name: 'Product: Apple Vision Pro', 
    type: 'Product Description', 
    status: 'draft', 
    date: '5 hours ago',
    icon: ICONS.tag 
  },
  { 
    id: 3, 
    name: 'Email: Cold Outreach Campaign', 
    type: 'Email Generator', 
    status: 'scheduled', 
    date: '1 day ago',
    icon: ICONS.mail 
  },
  { 
    id: 4, 
    name: 'Instagram: "Summer Vibes"', 
    type: 'Social Post', 
    status: 'published', 
    date: '2 days ago',
    icon: ICONS.instagram 
  },
  { 
    id: 5, 
    name: 'Blog: "How to use Scriptoplay"', 
    type: 'Blog Post', 
    status: 'draft', 
    date: '3 days ago',
    icon: ICONS.edit 
  },
];

// 3. Helper Component for Status Badges
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    published: 'bg-green-500/10 text-green-400 border-green-500/20',
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const labels = {
    published: 'Published',
    draft: 'Draft',
    scheduled: 'Scheduled',
  };

  const currentStyle = styles[status as keyof typeof styles] || styles.draft;
  const currentLabel = labels[status as keyof typeof labels] || 'Unknown';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${currentStyle}`}>
      {status === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
      {currentLabel}
    </span>
  );
};

export default function DataTables() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#262626] bg-[#0f0f0f]">
      {/* Table Container for scrolling */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-[#141414] text-xs uppercase text-gray-500 border-b border-[#262626]">
              <th className="px-6 py-4 font-semibold tracking-wider">Document Name</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Type</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider text-right">Last Edited</th>
              <th className="px-4 py-4 font-semibold tracking-wider w-[50px]"></th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[#262626]">
            {recentItems.map((item) => (
              <tr 
                key={item.id} 
                className="group hover:bg-[#1a1a1a] transition-colors duration-200"
              >
                {/* Name Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                      <Icon icon={item.icon} size={16} />
                    </div>
                    <span className="font-medium text-white group-hover:text-purple-400 transition-colors">
                      {item.name}
                    </span>
                  </div>
                </td>

                {/* Type Column */}
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {item.type}
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={item.status} />
                </td>

                {/* Date Column */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 font-mono text-xs">
                  {item.date}
                </td>

                {/* Actions Column */}
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <button className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-[#262626] transition-all opacity-0 group-hover:opacity-100">
                    <Icon icon={ICONS.moreVertical} size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Optional: Simple Footer "View All" */}
      <div className="border-t border-[#262626] px-6 py-3 bg-[#141414]">
        <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors ml-auto">
          View all history <Icon icon={ICONS.chevronRight} size={12} />
        </button>
      </div>
    </div>
  );
}