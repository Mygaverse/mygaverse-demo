import React from 'react';

export default function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className="absolute top-full mt-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
        {content}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border-t border-l border-gray-700"></div>
      </div>
    </div>
  );
}
