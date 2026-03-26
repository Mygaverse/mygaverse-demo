'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import Badge from '@/components/scriptoplay/ui/Badge';
import Button from '@/components/scriptoplay/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/scriptoplay/ui/LoadingScreen';
// Layout components
import RightPanel from '@/components/scriptoplay/dashboard/layout/RightPanel';
import FilmEditor from '@/components/scriptoplay/dashboard/workspace/FilmEditor';
import CartoonEditor from '@/components/scriptoplay/dashboard/workspace/CartoonEditor';
// Hook and types
import { useProject } from '@/hooks/scriptoplay/useProject'; // Import hook
import { aiService } from '@/services/scriptoplay/aiService';


const WorkspaceLayout = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id'); // Get ID from URL
  const source = searchParams.get('source');
  const type = searchParams.get('type'); // 'cartoon' or undefined
  const isGenerated = source === 'blender';

  // USE THE HOOK
  const { project, loading, saveProject, saveDraft, versions } = useProject(projectId, source ?? undefined);

  const [isMagicMode, setMagicMode] = useState(false);

  if (loading) return <LoadingScreen message="Loading Project..." />;

  // --- HANDLE CARTOON CONFIG FROM URL ---
  const configParam = searchParams.get('config');
  let initialConfig = null;
  try {
    if (configParam) {
      initialConfig = JSON.parse(configParam);
    }
  } catch (e) {
    console.error("Failed to parse config", e);
  }

  // If we have a real project loaded, use that. Otherwise use the URL config.
  const effectiveProjectData = project?.data || initialConfig;

  // Determine effective type: URL param OR saved project data
  const isCartoon = type === 'cartoon' || effectiveProjectData?.type === 'cartoon';

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0a0a0a]">

      {/* BRANCHING LOGIC */}
      {isCartoon ? (
        <CartoonEditor
          projectId={projectId}
          projectData={effectiveProjectData}
          onSave={saveProject}
          onSaveDraft={saveDraft}
          versions={versions}
          isGenerated={isGenerated}
        />
      ) : (
        <FilmEditor
          projectData={project?.data}
          onSave={saveProject}
          onSaveDraft={saveDraft}
          versions={versions}
          isGenerated={isGenerated}
          isMagicMode={isMagicMode}
        />
      )}

      {/* Only show Right Panel for Film Mode for now, or adapt it for Cartoon later */}
      {!isCartoon && (
        <RightPanel isMagicMode={isMagicMode} setMagicMode={setMagicMode} />
      )}
    </div>
  );
};

export default function WorkspacePage() {
  return (
    <Suspense fallback={<LoadingScreen message="Initializing Workspace..." />}>
      <WorkspaceLayout />
    </Suspense>
  );
}