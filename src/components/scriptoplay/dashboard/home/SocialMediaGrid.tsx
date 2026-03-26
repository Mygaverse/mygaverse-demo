import React from 'react';
import Image from 'next/image';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

interface SocialCardProps {
  icon: string;
  iconColor: string;
  img: string;
  text: string;
  time: string;
}

const SocialCard = ({ icon, iconColor, img, text, time }: SocialCardProps) => (
  <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col h-full">
    <div className="p-3 border-b border-[#262626] flex items-center gap-2">
      <Icon icon={icon} className={iconColor} size={20} />
    </div>
    <div className="relative h-32 w-full bg-gray-800">
      <Image 
        src={img} 
        alt="Post" 
        fill 
        className="object-cover opacity-80 hover:opacity-100 transition-opacity"
      />
    </div>
    <div className="p-4 flex flex-col flex-1">
      <p className="text-sm mb-3 text-gray-300 line-clamp-2">{text}</p>
      <div className="mt-auto">
        <p className="text-[10px] text-gray-400 mb-3">{time}</p>
        <div className="flex items-center gap-2">
          <Icon icon={ICONS.check} size={12} className="text-green-500" />
          <span className="text-[10px] text-green-500 font-medium">Published</span>
        </div>
      </div>
    </div>
  </div>
);

export default function SocialMediaGrid() {
  const posts = [
    {
      icon: ICONS.instagram, iconColor: "text-pink-500",
      img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop",
      text: "🌿 Bring out your natural glow. Our Glow Up skincare collection...",
      time: "August 25, 2025 at 12pm"
    },
    // ... add your other posts here
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 cursor-pointer">
      {posts.map((post, i) => (
        <SocialCard key={i} {...post} />
      ))}
    </div>
  );
}