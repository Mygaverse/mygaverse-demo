'use client';

import React, { useEffect, useState } from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

interface HobbyistPostProductionPhaseProps {
  projectData: any;
  onBack: () => void;
  onFinish: () => void;
}

export default function HobbyistPostProductionPhase({ projectData, onBack, onFinish }: HobbyistPostProductionPhaseProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (projectData?.modules?.hobbyistVideo) {
      setVideoUrl(projectData.modules.hobbyistVideo);
    }
  }, [projectData]);

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const resp = await fetch(videoUrl);
      const blob = await resp.blob();
      const tempUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = tempUrl;
      a.download = `${projectData?.title || 'Scriptoplay_Cartoon'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tempUrl);
    } catch (e) {
      alert("Download failed. You can right click the video and 'Save Video As'.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* HEADER */}
      <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#0f0f0f]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <Icon icon={ICONS.chevronLeft} />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Icon icon={ICONS.film} className="text-purple-500" />
            Final Review
          </h1>
        </div>
        <div>
          <button
            onClick={onFinish}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
          >
            <Icon icon={ICONS.check} /> COMPLETE PROJECT
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-grid-pattern relative">
        <div className="w-full max-w-4xl max-h-[70vh] aspect-video bg-[#050505] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center relative">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center">
              <Icon icon={ICONS.warning} size={64} className="text-red-500 mb-4 opacity-50" />
              <p className="text-gray-400 text-sm font-mono tracking-wide">NO VIDEO FOUND</p>
              <p className="text-gray-600 text-xs mt-2">Go back to the Director's Booth to generate your cartoon.</p>
            </div>
          )}
        </div>

        {/* Action Bar Below Video */}
        {videoUrl && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-[#141414] border border-[#333] hover:border-purple-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-[#1a1a1a]"
            >
              <Icon icon={ICONS.download} size={20} /> Download MP4
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(videoUrl);
                alert("Video Link copied to clipboard!");
              }}
              className="px-6 py-3 bg-[#141414] border border-[#333] hover:border-pink-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-[#1a1a1a]"
            >
              <Icon icon={ICONS.copy} size={20} /> Copy Share Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
