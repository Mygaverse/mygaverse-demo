import React from 'react';
import Badge from '@/components/scriptoplay/ui/Badge';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function SimpleTables() {
  const items = [
    { id: 1, name: 'SEO Article: "AI Trends"', type: 'Article Generator', status: 'success', date: '2 hours ago' },
    { id: 2, name: 'Product: Apple Mini', type: 'Product Desc', status: 'default', date: '4 hours ago' },
    { id: 3, name: 'Email: Cold Outreach', type: 'Email Gen', status: 'warning', date: '1 day ago' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#262626] text-xs text-gray-500 uppercase tracking-wider">
            <th className="py-3 font-medium">Document Name</th>
            <th className="py-3 font-medium">Type</th>
            <th className="py-3 font-medium">Status</th>
            <th className="py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((item) => (
            <tr key={item.id} className="border-b border-[#262626]/50 group hover:bg-[#1a1a1a] transition-colors">
              <td className="py-4 text-white font-medium pl-2">{item.name}</td>
              <td className="py-4 text-gray-400">{item.type}</td>
              <td className="py-4">
                <Badge variant={item.status as any}>{item.status === 'default' ? 'Draft' : 'Done'}</Badge>
              </td>
              <td className="py-4 text-right pr-2">
                <button className="text-gray-500 hover:text-white transition-colors">
                  <Icon icon={ICONS.moreVertical} size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}