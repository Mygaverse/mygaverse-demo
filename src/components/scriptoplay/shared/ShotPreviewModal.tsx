'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

interface ShotPreviewModalProps {
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

export default function ShotPreviewModal({ imageUrl, title, onClose }: ShotPreviewModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-50"
      >
        <Icon icon={ICONS.close} size={32} />
      </button>

      <div
        className="relative max-w-6xl w-full flex flex-col items-center gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative shadow-2xl shadow-purple-900/20 w-fit max-w-full">
          <img
            src={imageUrl}
            alt={title || 'Shot Preview'}
            className="max-h-[75vh] object-contain rounded-lg border border-white/10"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-6 bg-[#1a1a1a] border border-[#262626] p-4 rounded-2xl">
          {title && (
            <>
              <div className="text-left px-2">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-gray-500 uppercase">Production Shot</p>
              </div>
              <div className="h-8 w-px bg-[#333]" />
            </>
          )}

          {/* Download */}
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] hover:bg-[#333] text-white transition-colors text-sm font-medium"
          >
            <Icon icon={ICONS.download} size={16} /> Download
          </a>

          {/* Open in new tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] hover:bg-[#333] text-white transition-colors text-sm font-medium"
          >
            <Icon icon={ICONS.eye} size={16} /> Full Size
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
