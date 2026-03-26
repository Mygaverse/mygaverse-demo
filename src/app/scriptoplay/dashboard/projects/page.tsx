'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { projectService } from '@/services/scriptoplay/projectService';
// import { ProjectDocument } from '@/types/scriptoplay/firestore';

interface Timestamp {
   seconds: number;
   nanoseconds: number;
   toDate: () => Date;
}

interface ProjectDocument {
   id: string;
   title: string;
   status: string;
   lastModified?: Timestamp;
   data: any;
}
import Icon from '@/components/scriptoplay/ui/Icon';
import Button from '@/components/scriptoplay/ui/Button';
import { ICONS } from '@/config/scriptoplay/icons';

// Filter Categories
const CATEGORIES = [
   { id: 'all', label: 'All Projects' },
   { id: 'film', label: 'Feature Films' },
   { id: 'tv', label: 'TV Series' },
   { id: 'animation', label: 'Animation' },
];

export default function MyProjectsPage() {
   const { user } = useAuth();
   const [projects, setProjects] = useState<ProjectDocument[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeFilter, setActiveFilter] = useState('all');

   // Rename Logic
   const [editingId, setEditingId] = useState<string | null>(null);
   const [tempTitle, setTempTitle] = useState('');

   const handleRename = async (projectId: string) => {
      if (!tempTitle.trim()) {
         setEditingId(null);
         return;
      }

      // Optimistic update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title: tempTitle } : p));
      setEditingId(null);

      try {
         await projectService.updateProject(projectId, { title: tempTitle } as any); // Type cast if necessary or update ProjectDocument definition
      } catch (e) {
         console.error("Rename failed", e);
         // Could revert here if needed
      }
   };

   useEffect(() => {
      async function load() {
         if (user?.uid) {
            try {
               const data = await projectService.getUserProjects(user.uid);
               setProjects(data);
            } catch (error) {
               console.error(error);
            } finally {
               setLoading(false);
            }
         }
      }
      load();
   }, [user]);

   // Mock filtering for MVP (Since we haven't strictly saved 'type' yet)
   // In a real app, you'd check: project.data.type === activeFilter
   const filteredProjects = activeFilter === 'all'
      ? projects
      : projects.filter(p => false); // For now, everything shows under ALL until we save 'type'

   return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-[#0a0a0a]">

         {/* HEADER */}
         <div className="px-8 py-6 border-b border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div>
               <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
               <p className="text-sm text-gray-400">Manage your scripts and development files.</p>
            </div>
            <Link href="/scriptoplay/dashboard/create">
               <Button variant="primary" icon={ICONS.plus}>New Project</Button>
            </Link>
         </div>

         {/* FILTERS */}
         <div className="px-8 py-4 border-b border-[#262626] bg-[#0f0f0f] shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2">
               {CATEGORIES.map((cat) => (
                  <button
                     key={cat.id}
                     onClick={() => setActiveFilter(cat.id)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeFilter === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626]'
                        }`}
                  >
                     {cat.label}
                  </button>
               ))}
            </div>
         </div>

         {/* GRID */}
         <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-800">
            {loading ? (
               <div className="text-gray-500">Loading library...</div>
            ) : filteredProjects.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Icon icon={ICONS.folder} size={48} className="mb-4 opacity-20" />
                  <p>No projects found in this category.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects.map((project) => (
                     <Link key={project.id} href={`/scriptoplay/dashboard/workspace?id=${project.id}`}>
                        <div className="group bg-[#141414] border border-[#262626] rounded-xl overflow-hidden hover:border-gray-600 transition-all cursor-pointer flex flex-col h-[280px] relative">

                           {/* Thumbnail Placeholder */}
                           <div className="h-32 bg-gradient-to-br from-gray-800 to-black relative p-4 flex items-center justify-center">
                              <Icon icon={ICONS.fileText} size={32} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                              {/* Status Tag */}
                              <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-gray-300 border border-white/10 uppercase tracking-wide">
                                 {project.status}
                              </div>

                              {/* DELETE BUTTON (Visible on Hover) */}
                              <button
                                 onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
                                       try {
                                          await projectService.deleteProject(project.id);
                                          setProjects(prev => prev.filter(p => p.id !== project.id));
                                       } catch (err) {
                                          console.error("Failed to delete", err);
                                          alert("Failed to delete project.");
                                       }
                                    }
                                 }}
                                 className="absolute top-3 left-3 p-2 bg-black/80 hover:bg-red-600 text-white rounded-lg backdrop-blur border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-10"
                                 title="Delete Project"
                              >
                                 <Icon icon={ICONS.delete} size={14} />
                              </button>
                           </div>

                           {/* Content */}
                           <div className="p-5 flex-1 flex flex-col">
                              {editingId === project.id ? (
                                 <div className="mb-2 flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                                    <input
                                       autoFocus
                                       value={tempTitle}
                                       onChange={(e) => setTempTitle(e.target.value)}
                                       onBlur={() => handleRename(project.id)}
                                       onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleRename(project.id);
                                          if (e.key === 'Escape') setEditingId(null);
                                       }}
                                       onClick={(e) => e.stopPropagation()}
                                       className="flex-1 bg-[#0a0a0a] border border-purple-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                    />
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleRename(project.id);
                                       }}
                                       className="p-1 hover:text-green-400"
                                    >
                                       <Icon icon={ICONS.check} size={14} />
                                    </button>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2 mb-2 group/title">
                                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                                       {project.title}
                                    </h3>
                                    <button
                                       onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingId(project.id);
                                          setTempTitle(project.title);
                                       }}
                                       className="text-gray-600 hover:text-white opacity-0 group-hover/title:opacity-100 transition-opacity p-1"
                                       title="Rename Project"
                                    >
                                       <Icon icon={ICONS.pen} size={12} />
                                    </button>
                                 </div>
                              )}

                              <p className="text-xs text-gray-500 line-clamp-3 mb-4 flex-1 leading-relaxed">
                                 {project.data.logline || "No logline description available."}
                              </p>

                              <div className="flex items-center justify-between text-[10px] text-gray-600 pt-4 border-t border-[#262626] mt-auto">
                                 <span>Updated {project.lastModified?.toDate().toLocaleDateString()}</span>
                                 <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                              </div>
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}