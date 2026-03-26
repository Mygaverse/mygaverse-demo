import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function RecentLaunches() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4 cursor-pointer">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 hover:border-gray-600 transition-colors flex flex-col">
            <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-[#1a1a1a] border border-[#262626] rounded-md text-[10px] text-gray-300 uppercase tracking-wide">
                    {i % 2 === 0 ? 'Article Generator' : 'Product Description'}
                </span>
            </div>
            <p className="text-sm mb-8 text-gray-300 line-clamp-3 leading-relaxed">
               {i % 2 === 0 
                 ? "Une agence SEO au service de votre visibilité en ligne Dans un environnement numérique toujours plus..."
                 : "Découvrez l'Apple Mini, le concentré de puissance et d'élégance pour les espaces modernes."}
            </p>
            <div className="mt-auto flex items-center justify-between">
                <span className="text-[10px] text-gray-500">2 hours ago</span>
                <button className="hover:text-white transition-colors text-gray-500">
                   <Icon icon={ICONS.moreVertical} size={14} />
                </button>
            </div>
        </div>
      ))}
    </div>
  );
}