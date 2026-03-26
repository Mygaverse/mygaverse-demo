'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import ScriptBlender from '@/components/scriptoplay/dashboard/tools/ScriptBlender';
import { useProject } from '@/hooks/scriptoplay/useProject';
import LoadingScreen from '@/components/scriptoplay/ui/LoadingScreen';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { projectService } from '@/services/scriptoplay/projectService';

function CartoonBlenderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  // Handle config passed from URL (for new projects)
  const configParam = searchParams.get('config');
  const initialConfigFromUrl = configParam ? JSON.parse(configParam) : null;
  const { project, loading } = useProject(projectId); // Hook handles loading existing project

  const { user } = useAuth(); // Need user to create project


  const handleLoglineSelect = async (logline: string) => {
    if (projectId) {
      // A. Update Existing
      try {
        await projectService.updateProject(projectId, { logline });
        router.push(`/scriptoplay/dashboard/workspace?id=${projectId}&type=cartoon&logline=${encodeURIComponent(logline)}`);
      } catch (error) {
        console.error("Failed to update project", error);
        alert("Failed to save logline.");
      }
    } else {
      // B. Create New (using URL config + new logline)
      if (!user) {
        alert("Please log in to save.");
        return;
      }

      try {
        // Merge URL config with the logline
        const projectData = {
          ...initialConfigFromUrl,
          logline: logline
        };

        const newId = await projectService.createProject(user.uid, 'New Cartoon Project', projectData);
        router.push(`/scriptoplay/dashboard/workspace?id=${newId}&type=cartoon`);

      } catch (error) {
        console.error("Failed to create project", error);
        alert("Failed to create project.");
      }
    }
  };

  if (loading) return <LoadingScreen message="Loading Blender..." />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#262626] flex items-center px-8 bg-[#141414]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <Icon icon={ICONS.chevronLeft} size={20} /> Back to Workspace
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 flex flex-col items-center">
        <div className="max-w-6xl w-full h-[600px]">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Script Blender</h1>
            <p className="text-gray-400">Mix ingredients to generate the perfect logline for your cartoon.</p>
          </div>

          <ScriptBlender
            mode="cartoon"
            initialConfig={project?.data || initialConfigFromUrl}
            onLoglineSelect={handleLoglineSelect}
          />
        </div>
      </main>
    </div>
  );
}

export default function CartoonBlenderPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Initializing..." />}>
      <CartoonBlenderContent />
    </Suspense>
  );
}
