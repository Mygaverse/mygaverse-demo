
import { createClient } from '@/lib/scriptoplay/supabase/client';
import { ProjectDocument, VersionDocument } from '@/types/scriptoplay/firestore'; // Reusing types, or will define new ones

const supabase = createClient();

interface ProjectRow {
  id: string;
  owner_id: string;
  title: string;
  status: string;
  last_modified: string;
  created_at: string;
  data: any; // JSONB
}

export const projectService = {
  // 1. CREATE A NEW PROJECT
  async createProject(userId: string, title: string, initialData: any = {}) {
    const defaultData = {
      logline: initialData.logline || '',
      synopsis: initialData.synopsis || {},
      modules: initialData.modules || { characters: [], settings: [], themes: [], plots: [] },
      type: initialData.type || 'film',
      // Cartoon Specifics (Spread remaining props if any)
      ...((initialData.type === 'cartoon') ? {
        style: initialData.style,
        audience: initialData.audience,
        vibe: initialData.vibe,
        audioConfig: initialData.audioConfig,
        length: initialData.length,
        genre: initialData.genre,
        theme: initialData.theme,
        tier: initialData.tier
      } : {})
    };

    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: userId,
        title: title || 'Untitled Project',
        status: 'draft',
        data: defaultData
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase createProject error:", error);
      throw error;
    }

    return data.id;
  },

  // 2. GET USER'S PROJECTS
  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('last_modified', { ascending: false });

    if (error) throw error;

    // Mock Firestore Timestamp to satisfy ProjectDocument interface
    const mockTimestamp = (dateStr: string) => {
      const date = new Date(dateStr);
      const millis = date.getTime();
      return {
        seconds: Math.floor(millis / 1000),
        nanoseconds: (millis % 1000) * 1000000,
        toDate: () => date,
        toMillis: () => millis,
        isEqual: (other: any) => other.seconds === Math.floor(millis / 1000),
        toJSON: () => ({ seconds: Math.floor(millis / 1000), nanoseconds: (millis % 1000) * 1000000 }),
        valueOf: () => date.valueOf().toString()
      };
    };

    // Map to frontend interface if needed
    return data.map((row: ProjectRow) => ({
      id: row.id,
      ownerId: row.owner_id,
      title: row.title,
      status: row.status as 'draft' | 'completed',
      lastModified: mockTimestamp(row.last_modified) as any, // Cast to any to avoid strict type checks if interface differs slightly
      data: row.data
    }));
  },

  // 3. GET SINGLE PROJECT
  async getProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw new Error('Project not found');

    const mockTimestamp = (dateStr: string) => {
      const date = new Date(dateStr);
      const millis = date.getTime();
      return {
        seconds: Math.floor(millis / 1000),
        nanoseconds: (millis % 1000) * 1000000,
        toDate: () => date,
        toMillis: () => millis,
        isEqual: (other: any) => other.seconds === Math.floor(millis / 1000),
        toJSON: () => ({ seconds: Math.floor(millis / 1000), nanoseconds: (millis % 1000) * 1000000 }),
        valueOf: () => date.valueOf().toString()
      };
    };

    return {
      id: data.id,
      ownerId: data.owner_id,
      title: data.title,
      status: data.status as 'draft' | 'completed',
      lastModified: mockTimestamp(data.last_modified) as any,
      data: data.data
    };
  },

  // 4. UPDATE PROJECT (Auto-save) with Merging
  async updateProject(projectId: string, data: Partial<any>) {
    // Determine what to update.
    // Ideally we want deep merge for 'data'.
    // Supabase jsonb update usually overwrites the column/field unless we use specialized query.
    // BUT we can update the jsonb blob entirely from the frontend state which is usually 'complete' for that module.

    // However, existing calls might pass partial 'data'.
    // E.g. { 'data.logline': '...' }
    // We need to fetch current, merge, save? OR just push the whole blob if client has it.

    // Simplest approach: The client passes the Full State usually?
    // Let's check how it's used.

    // In CartoonEditor: safeSave passes the WHOLE projectData generally?
    // No, it passes { ...projectData, modules: ... }.

    // If the input `data` is the JSON blob content directly?
    // Existing signature: async updateProject(projectId: string, data: Partial<ProjectDocument['data']>)

    // We can use a stored procedure for deep merge, or just fetch-merge-save for now (optimistic locking issue potential but tolerable for single user).
    // Better: Supabase accepts jsonb updates that merge at top level?

    // Let's assume we receive the TOP LEVEL fields of 'data' to merge.

    // Construct the update object for the TABLE
    const updates: any = {
      last_modified: new Date().toISOString()
    };

    // If 'data' is passed, we update the data column.
    // Note: If we do .update({ data: newData }), it REPLACES the jsonb.
    // Postgres jsonb_set is better but complex to construct dynamically.

    // Let's fetch-merge-save for safety on complex nested structures if we can't trust full replace.
    // But usually frontend has full state.

    // Let's try to update using a merge approach if possible, or simple replace if data is comprehensive.
    // For now, let's treat `data` as the patch for the `data` column.

    // We need to fetch first to merge?
    // A better way for JSONB in Supabase JS:
    // Just passing the data often replaces it.

    // Let's follow the Firestore pattern: `updateDoc(docRef, updates)` merges fields.
    // In Postgres, a simple Update replaces.
    // We will Implement Fetch-Merge-Update for correctness.

    if (Object.keys(data).length > 0) {
      const { data: current } = await supabase.from('projects').select('data').eq('id', projectId).single();
      if (current) {
        const mergedData = { ...current.data, ...data };
        updates.data = mergedData;
      }
    }

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) throw error;
  },

  // 5. SAVE VERSION
  async saveVersion(projectId: string, phase: string, data: any) {
    const { error } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        phase,
        label: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Draft`,
        snapshot_data: data
      });

    if (error) throw error;
  },

  // 6. GET VERSIONS
  async getVersions(projectId: string) {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });

    if (error) throw error;


    const mockTimestamp = (dateStr: string) => {
      const date = new Date(dateStr);
      const millis = date.getTime();
      return {
        seconds: Math.floor(millis / 1000),
        nanoseconds: (millis % 1000) * 1000000,
        toDate: () => date,
        toMillis: () => millis,
        isEqual: (other: any) => other.seconds === Math.floor(millis / 1000),
        toJSON: () => ({ seconds: Math.floor(millis / 1000), nanoseconds: (millis % 1000) * 1000000 }),
        valueOf: () => date.valueOf().toString()
      };
    };

    return data.map((row: any) => ({
      id: row.id,
      timestamp: mockTimestamp(row.timestamp) as any,
      label: row.label,
      phase: row.phase,
      snapshotData: row.snapshot_data
    }));
  },

  // 7. DELETE PROJECT
  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }
};
