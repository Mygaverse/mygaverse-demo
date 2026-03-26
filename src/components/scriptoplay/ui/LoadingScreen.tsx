import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0a] fixed inset-0 z-50">
      <div className="relative mb-4">
        <div className="w-10 h-10 border-2 border-[#262626] border-t-purple-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon icon={ICONS.sparkles} size={12} className="text-purple-600" />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 animate-pulse uppercase tracking-wider">{message}</p>
    </div>
  );
}
