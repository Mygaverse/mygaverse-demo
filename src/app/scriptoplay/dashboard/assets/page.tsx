'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { assetService, Asset } from '@/services/scriptoplay/assetService';
import { storageService } from '@/services/scriptoplay/storageService';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { motion } from 'framer-motion';

export default function MyAssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // 4 columns * 2 rows

  useEffect(() => {
    loadAssets();
  }, [user]);

  // ... (unchanged code) ...

  const loadAssets = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await assetService.getUserAssets(user.id);
      setAssets(data as Asset[]);
    } catch (error) {
      console.error("Failed to load assets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm('Are you sure you want to delete this asset completely?')) return;
    if (!user?.id) return;

    try {
      await assetService.deleteAsset(user.id, asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) setSelectedAsset(null); // Close modal if deleted
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete asset");
    }
  };

  // Filter & Pagination Logic
  const filteredAssets = filter === 'all' ? assets : assets.filter(a => a.type === filter);
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const displayedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="p-8 h-full flex flex-col max-w-[1600px] mx-auto w-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">My Assets</h1>
          <p className="text-gray-400">Library of your generated characters, worlds, and clips.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-[#141414] p-1 rounded-lg border border-[#262626]">
          {['all', 'image', 'audio', 'video'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Icon icon={ICONS.spinner} className="animate-spin text-purple-500" size={32} />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-[#262626] rounded-2xl bg-[#0a0a0a]">
          <Icon icon={ICONS.image} size={48} className="mb-4 opacity-50" />
          <p>No assets found.</p>
          <p className="text-xs mt-2">Generate something in the Cartoon Studio!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-y-auto pb-8 pr-2">
            {displayedAssets.map(asset => (
              <motion.div
                key={asset.id}
                layoutId={asset.id}
                className="group relative bg-[#141414] border border-[#262626] rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-900/10 transition-all flex flex-col"
              >
                {/* Preview Area - Fixed Aspect Details */}
                <div
                  className="aspect-video bg-[#0a0a0a] relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                >
                  {asset.type === 'image' && (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  {asset.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-orange-500 gap-2 bg-gradient-to-br from-orange-900/10 to-transparent">
                      <Icon icon={ICONS.music || ICONS.volume} size={32} />
                      <span className="text-xs font-mono text-orange-400">AUDIO</span>
                    </div>
                  )}
                  {asset.type === 'video' && (
                    <div className="w-full h-full relative group/video">
                      <video src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-3 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 group-hover:scale-110 transition-transform">
                          <Icon icon={ICONS.play} size={24} className="text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }}
                      className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                      title="Preview"
                    >
                      <Icon icon={ICONS.eye} size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                      className="p-3 bg-red-600/90 text-white border border-red-500/50 rounded-full hover:bg-red-600 hover:scale-110 transition-all z-10"
                      title="Delete"
                    >
                      <Icon icon={ICONS.delete} size={20} />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-4 flex flex-col gap-1 bg-[#1a1a1a]">
                  <h4 className="font-bold text-white text-sm truncate" title={asset.name}>{asset.name || 'Untitled Asset'}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="capitalize">{asset.type}</span>
                    {asset.createdAt && (
                      <span>
                        {new Date(asset.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-auto pt-4 border-t border-[#262626]">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-[#262626] text-white disabled:opacity-50 hover:bg-[#333] transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-[#262626] text-white disabled:opacity-50 hover:bg-[#333] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Enhanced Modal */}
      {selectedAsset && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in fade-in duration-200" onClick={() => setSelectedAsset(null)}>

          {/* Close Button */}
          <button
            onClick={() => setSelectedAsset(null)}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full z-50"
          >
            <Icon icon={ICONS.close} size={32} />
          </button>

          <div className="relative max-w-6xl w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>

            {/* Asset Content */}
            <div className="relative shadow-2xl shadow-purple-900/20 w-fit max-w-full">
              {selectedAsset.type === 'image' ? (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.name}
                  className="max-h-[75vh] object-contain rounded-lg border border-white/10"
                />
              ) : selectedAsset.type === 'video' ? (
                <video
                  src={selectedAsset.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-lg border border-white/10"
                />
              ) : (
                <div className="bg-[#141414] p-12 rounded-2xl border border-[#262626] text-center w-[500px] flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                    <Icon icon={ICONS.music} size={48} />
                  </div>
                  <audio src={selectedAsset.url} controls className="w-full" />
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center gap-6 bg-[#1a1a1a] border border-[#262626] p-4 rounded-2xl">
              <div className="text-left px-2">
                <h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3>
                <p className="text-xs text-gray-500 uppercase">{selectedAsset.type} • {new Date((selectedAsset.createdAt?.seconds || 0) * 1000).toLocaleDateString()}</p>
              </div>

              <div className="h-8 w-px bg-[#333]"></div>

              {/* Download (New) */}
              <a
                href={selectedAsset.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262626] hover:bg-[#333] text-white transition-colors text-sm font-medium"
              >
                <Icon icon={ICONS.download} size={16} /> Download
              </a>

              {/* Delete (Requested) */}
              <button
                onClick={() => handleDelete(selectedAsset)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white transition-all text-sm font-medium border border-red-500/20 hover:border-transparent"
              >
                <Icon icon={ICONS.delete} size={16} /> Delete Asset
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
