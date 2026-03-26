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
import { ICONS } from '@/config/scriptoplay/icons';
import Badge from '@/components/scriptoplay/ui/Badge';
import CartoonStudioBanner from '@/components/scriptoplay/dashboard/home/CartoonStudioBanner';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentProjects, setRecentProjects] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Recent Projects
  useEffect(() => {
    async function loadRecent() {
      if (user?.uid) {
        try {
          // Fetch all user projects (we'll filter client side for this view)
          const data = await projectService.getUserProjects(user.uid);
          setRecentProjects(data);
        } catch (error) {
          console.error("Failed to load projects", JSON.stringify(error, null, 2));
        } finally {
          setLoading(false);
        }
      }
    }
    loadRecent();
  }, [user]);

  // Filter Projects
  const cartoonProjects = recentProjects.filter(p => p.data?.type === 'cartoon').slice(0, 2);
  const filmProjects = recentProjects.filter(p => p.data?.type !== 'cartoon').slice(0, 2);

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="max-w-7xl mx-auto w-full p-8 lg:p-12 space-y-8">

        {/* 0. HERO: CARTOON STUDIO */}
        <section className="animate-in slide-in-from-top-4 duration-700 space-y-8">
          <CartoonStudioBanner />

          {/* Welcome Text */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Scriptoplay</h1>
            <p className="text-gray-400 text-lg">Your creative studio for AI-powered storytelling.</p>
          </div>
        </section>

        {/* 1. MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN: TOOLS (3 Rows) */}
          <div className="flex flex-col gap-6">

            {/* Row 1: Script Blender */}
            <Link
              href="/scriptoplay/dashboard/create"
              className="group relative h-[180px] bg-[#141414] border border-[#262626] hover:border-gray-500 rounded-3xl p-8 overflow-hidden transition-all hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col justify-center"
            >
              <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2, rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-pink-600/50 blur-xl rounded-full"
                />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                    <Icon icon={ICONS.blender} size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Script Blender</h2>
                </div>
                <p className="text-gray-400 text-sm max-w-sm">Mix genres and ideas to spark something new.</p>
              </div>
              <div className="absolute bottom-8 right-8 text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-x-2">
                <Icon icon={ICONS.arrowRight} />
              </div>
            </Link>

            {/* Row 2: Have a Storyline */}
            <Link
              href="/scriptoplay/dashboard/workspace"
              className="group relative h-[180px] bg-gradient-to-br from-[#141414] to-[#1a1a1a] border border-[#262626] hover:border-gray-500 rounded-3xl p-8 overflow-hidden transition-all hover:shadow-xl flex flex-col justify-center"
            >
              <div className="absolute right-8 top-8 w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Icon icon={ICONS.edit} size={24} />
              </div>
              <div className="relative z-10 max-w-sm">
                <h2 className="text-2xl font-bold text-white mb-2">Have a storyline?</h2>
                <p className="text-gray-400 text-sm">Jump straight into the editor with AI Co-pilot.</p>
              </div>
            </Link>

            {/* Row 3: Script Scan */}
            <div className="relative h-[180px] bg-[#0f0f0f] border border-[#262626] rounded-3xl p-8 overflow-hidden group cursor-not-allowed opacity-75 hover:opacity-100 transition-opacity flex flex-col justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="relative z-10 flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-gray-500 group-hover:text-purple-500 transition-colors">
                  <Icon icon={ICONS.upload} size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    Script Scan <Badge variant="neutral" className="bg-[#262626] h-auto py-0.5 border-none text-[10px]">Soon</Badge>
                  </h2>
                </div>
              </div>
              <p className="text-gray-500 text-sm relative z-10">Analyze existing scripts for pacing and plot structure.</p>
            </div>

          </div>

          {/* RIGHT COLUMN: RECENT (2 Sections) */}
          <div className="flex flex-col gap-6 h-full">

            <h2 className="text-xl font-bold text-white mb-2">Most Recent Projects</h2>

            {/* 1. RECENT CARTOONS */}
            <div className="flex-1 overflow-hidden relative border border-[#262626] rounded-3xl p-6 group">
              {/* Background Image for Cartoon Projects */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/images/cartoon-studio-bg.png"
                  alt="Background"
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent"></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Icon icon={ICONS.sparkles} className="text-purple-400" size={18} /> Cartoon Studio
                  </h3>
                  {cartoonProjects.length > 0 && (
                    <Link href="/scriptoplay/dashboard/projects?filter=cartoon" className="text-xs text-gray-500 hover:text-white">View All</Link>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-[#1a1a1a]/50 backdrop-blur-sm rounded-xl animate-pulse" />)}
                  </div>
                ) : cartoonProjects.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 min-h-[120px]">
                    <Icon icon={ICONS.box} size={32} className="opacity-20" />
                    <p className="text-sm">No cartoons yet.</p>
                    <Link href="/scriptoplay/dashboard/create-cartoon" className="text-xs text-purple-400 hover:underline">Create First Project</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartoonProjects.map(project => (
                      <Link key={project.id} href={`/scriptoplay/dashboard/workspace?id=${project.id}&type=cartoon`} className="block group/item">
                        <div className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#262626] p-4 rounded-xl hover:border-purple-500/50 transition-all flex items-center gap-4 hover:bg-[#1a1a1a]">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center text-purple-200 border border-purple-500/20">
                            <Icon icon={ICONS.film} size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-200 text-sm group-hover/item:text-white">{project.title}</h4>
                            <div className="text-[10px] text-gray-500 flex gap-2">
                              <span>{project.lastModified?.toDate().toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="uppercase">{project.status}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. RECENT FILMS */}
            <div className="flex-1 bg-[#141414]/50 border border-[#262626] rounded-3xl p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Icon icon={ICONS.fileText} className="text-blue-400" size={18} /> Screenplays
                </h3>
                {filmProjects.length > 0 && (
                  <Link href="/scriptoplay/dashboard/projects" className="text-xs text-gray-500 hover:text-white">View All</Link>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1].map(i => <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl animate-pulse" />)}
                </div>
              ) : filmProjects.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 min-h-[120px]">
                  <Icon icon={ICONS.documents} size={32} className="opacity-20" />
                  <p className="text-sm">No scripts yet.</p>
                  <Link href="/scriptoplay/dashboard/create" className="text-xs text-blue-400 hover:underline">Start Writing</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filmProjects.map(project => (
                    <Link key={project.id} href={`/scriptoplay/dashboard/workspace?id=${project.id}`} className="block group">
                      <div className="bg-[#1a1a1a] border border-[#262626] p-4 rounded-xl hover:border-blue-500/50 transition-all flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-gray-400 border border-[#333] group-hover:text-white">
                          <Icon icon={ICONS.edit} size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-sm group-hover:text-white">{project.title}</h4>
                          <div className="text-[10px] text-gray-500 flex gap-2">
                            <span>{project.lastModified?.toDate().toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="uppercase">{project.status}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 2. FOOTER ROW: EXAMPLES & LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Explore Demos (Moved Here) */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] transition-colors cursor-pointer border border-[#262626] hover:border-purple-500/30 group">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
              <Icon icon={ICONS.play} size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-200 group-hover:text-white">Explore Demos</h3>
              <p className="text-xs text-gray-500">See generated pilots.</p>
            </div>
          </div>

          {[
            { title: "Documentation", icon: ICONS.documents, desc: "Prompting Guide.", color: 'bg-blue-500/10 text-blue-500' },
            { title: "Community", icon: ICONS.user, desc: "Connect with others.", color: 'bg-green-500/10 text-green-500' },
            { title: "API Access", icon: ICONS.code, desc: "Dev Integration.", color: 'bg-pink-500/10 text-pink-500' }
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#141414] transition-colors cursor-pointer border border-transparent hover:border-[#262626] group">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color} group-hover:brightness-125 transition-all`}>
                <Icon icon={item.icon} size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}