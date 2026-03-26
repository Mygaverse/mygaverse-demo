import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

function AvatarBubble({ emoji, bg, top, left, right, bottom, translate }: any) {
  const style: any = { top, left, right, bottom };
  return (
    <div 
      className={`absolute w-12 h-12 rounded-full ${bg} border-4 border-[#1a1a1a] overflow-hidden flex items-center justify-center text-2xl ${translate || ''}`}
      style={style}
    >
      {emoji}
    </div>
  );
}

export default function InviteSection() {
  return (
    <>
      <div className="relative w-48 h-32 mb-2 shrink-0">
        <AvatarBubble emoji="👨" top="0" left="50%" translate="-translate-x-1/2" bg="bg-orange-100" />
        <AvatarBubble emoji="👨‍💼" top="28px" left="18px" bg="bg-teal-100" />
        <AvatarBubble emoji="👩" top="28px" right="18px" bg="bg-purple-100" />
        <AvatarBubble emoji="👨‍🦱" bottom="0" left="-12px" bg="bg-blue-100" />
        <AvatarBubble emoji="👴" bottom="0" right="-12px" bg="bg-pink-100" />
      </div>

      <h3 className="text-center text-white text-base mb-1">Add your team members&apos; email address</h3>
      <p className="text-center text-gray-400 text-base mb-6">to start collaborating. 📧</p>

      <div className="relative w-full mb-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon icon={ICONS.mail} size={20} />
        </div>
      </div>

      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg text-sm text-white font-medium transition-all shadow-lg shadow-purple-600/30">
        Invite Friends
      </button>
    </>
  );
}