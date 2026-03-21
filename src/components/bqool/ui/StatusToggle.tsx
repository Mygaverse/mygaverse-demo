'use client';

import React from 'react';

interface StatusToggleProps {
  status: 'active' | 'paused' | 'enabling';
  onClick: () => void;
  disabled?: boolean;
}

export const StatusToggle = ({ status, onClick, disabled }: StatusToggleProps) => {
  if (status === 'enabling') {
    return (
      <button disabled className="relative w-24 h-7 rounded-full bg-[#4aaada] transition-colors cursor-wait flex items-center px-1">
         <span className="text-[10px] font-bold text-white ml-2">Enabling</span>
         <div className="absolute right-1 w-5 h-5 bg-white rounded-full animate-pulse shadow-sm"></div>
      </button>
    );
  }

  const isActive = status === 'active';

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative w-24 h-7 rounded-full transition-colors flex items-center px-1 shadow-inner
        ${isActive ? 'bg-[#4aaada]' : 'bg-gray-300 hover:bg-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Text Label */}
      <span className={`absolute text-[10px] font-bold text-white w-full text-center transition-all ${isActive ? 'pr-4' : 'pl-4'}`}>
        {isActive ? 'Enabled' : 'Paused'}
      </span>

      {/* The Dot */}
      <div className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out
        ${isActive ? 'translate-x-[68px]' : 'translate-x-0'}
      `} />
    </button>
  );
};