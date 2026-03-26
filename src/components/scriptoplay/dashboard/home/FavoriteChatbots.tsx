import React from 'react';
import Image from 'next/image';

// Simple interface for a chatbot card
interface BotProps {
  name: string;
  role: string;
  // We allow either an image URL or initials/color
  img?: string; 
  initials?: string;
  bgColor?: string;
  textColor?: string;
}

const BotCard = ({ name, role, img, initials, bgColor, textColor }: BotProps) => (
  <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 hover:border-gray-600 transition-colors cursor-pointer group h-full">
    <div className="flex justify-center mb-3">
      {img ? (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 overflow-hidden ring-2 ring-[#0f0f0f] group-hover:ring-gray-600 transition-all relative">
          <Image 
            src={img} 
            alt={name} 
            fill 
            className="object-cover" 
          />
        </div>
      ) : (
        <div className={`w-14 h-14 rounded-full ${bgColor} flex items-center justify-center text-xl ${textColor} font-bold`}>
          {initials}
        </div>
      )}
    </div>
    <h4 className="text-center text-sm text-white mb-1">{name}</h4>
    <p className="text-center text-xs text-gray-400">{role}</p>
  </div>
);

export default function FavoriteChatbots() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BotCard 
        name="Career Counselor" 
        role="Personal Career Counselor" 
        img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
      />
      <BotCard 
        name="Interior Designer" 
        role="Personal Interior Designer" 
        initials="ID" 
        bgColor="bg-pink-200" 
        textColor="text-pink-800" 
      />
      <BotCard 
        name="Parenting Coach" 
        role="Personal Parenting Coach" 
        initials="PC" 
        bgColor="bg-teal-300" 
        textColor="text-teal-800" 
      />
      <BotCard 
        name="Language Tutor" 
        role="Personal Language Tutor" 
        img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" 
      />
    </div>
  );
}