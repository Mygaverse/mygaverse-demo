// src/hooks/useProject.ts
import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/scriptoplay/projectService';
import { ProjectDocument, VersionDocument } from '@/types/scriptoplay/firestore';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { useRouter } from 'next/navigation';

export function useProject(projectId: string | null, source?: string) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [project, setProject] = useState<ProjectDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<VersionDocument[]>([]);

  // 1. Load Project
  useEffect(() => {
    async function init() {
      if (!user) return;

      try {
        if (projectId) {
          // A. Load existing
          const data = await projectService.getProject(projectId);
          setProject(data);
          loadVersions(projectId);
        } else if (source === 'blender') {
          // B. Came from blender? Create new immediately or wait?
          // For MVP: Let's create a blank state, user saves to create doc.
          // Or better: Redirect to a new ID immediately.
          const newId = await projectService.createProject(user.uid, 'New Blended Project', {
            // In a real app, pass params via state/context, simplified here
            logline: "In a futuristic Mars Colony..." 
          });
          router.replace(`/scriptoplay/dashboard/workspace?id=${newId}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [projectId, user, source, router]);

  // 2. Load Versions
  const loadVersions = async (id: string) => {
    const v = await projectService.getVersions(id);
    setVersions(v);
  };

  // 3. Save Changes (Debounced ideally, manual here for MVP)
  const saveProject = async (newData: any) => {
    if (!project) return;
    setSaving(true);
    await projectService.updateProject(project.id, newData);
    setProject({ ...project, data: { ...project.data, ...newData } });
    setSaving(false);
  };

  // 4. Save Draft (Version)
  // SaveDraft to accept optional override data
  const saveDraft = async (phase: string, currentDataOverride?: any) => {
    if (!project) return;
    setSaving(true);
    
    // Use override data (what's on screen) OR fallback to last saved DB data
    const dataToSave = currentDataOverride || project.data;

    await projectService.saveVersion(project.id, phase, dataToSave);
    await loadVersions(project.id); 
    setSaving(false);
  };

  return {
    project,
    loading,
    saving,
    versions,
    saveProject,
    saveDraft
  };
}