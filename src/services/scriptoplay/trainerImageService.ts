import { createClient } from '@/lib/scriptoplay/supabase/client';

const supabase = createClient();

export interface TrainerImage {
  id: string;
  url: string;
  name: string;
  prompt: string;
  characterName: string;
  createdAt: string;
}

export const trainerImageService = {
  /** Save a newly generated trainer asset image to the trainer_images table */
  async saveImage(
    userId: string,
    data: { url: string; name: string; prompt: string; characterName: string }
  ): Promise<TrainerImage> {
    const { data: row, error } = await supabase
      .from('trainer_images')
      .insert({
        user_id: userId,
        url: data.url,
        name: data.name,
        prompt: data.prompt,
        character_name: data.characterName,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: row.id,
      url: row.url,
      name: row.name,
      prompt: row.prompt,
      characterName: row.character_name,
      createdAt: row.created_at,
    };
  },

  /** Fetch all trainer images (admin/trainer scoped by RLS) */
  async getAll(): Promise<TrainerImage[]> {
    const { data, error } = await supabase
      .from('trainer_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[trainerImageService] getAll error:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      url: row.url,
      name: row.name,
      prompt: row.prompt,
      characterName: row.character_name,
      createdAt: row.created_at,
    }));
  },

  /** Fetch user's My Assets images (from the existing assets table) */
  async getMyAssets(userId: string): Promise<TrainerImage[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'image')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[trainerImageService] getMyAssets error:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      url: row.url,
      name: row.name,
      prompt: row.prompt || '',
      characterName: row.metadata?.characterName || row.name,
      createdAt: row.created_at,
    }));
  },

  /** Delete a trainer image */
  async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('trainer_images')
      .delete()
      .eq('id', imageId);
    if (error) throw error;
  },
};
