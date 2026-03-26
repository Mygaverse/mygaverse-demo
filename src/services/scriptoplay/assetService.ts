
import { createClient } from '@/lib/scriptoplay/supabase/client';

const supabase = createClient();

const DEMO_ASSET_TTL_HOURS = 12;

export interface Asset {
  id: string;
  userId: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  name: string;
  prompt?: string;
  createdAt?: any;
  metadata?: any;
  projectId?: string;
  expiresAt?: string | null;
}

export const assetService = {
  /**
   * Saves metadata for a new asset to 'assets' table.
   * Pass isDemo=true to set a 12-hour expiry.
   */
  async saveAsset(userId: string, assetData: Omit<Asset, 'id' | 'userId' | 'createdAt'>, isDemo = false) {
    const expiresAt = isDemo
      ? new Date(Date.now() + DEMO_ASSET_TTL_HOURS * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: userId,
        type: assetData.type,
        name: assetData.name,
        url: assetData.url,
        prompt: assetData.prompt,
        metadata: assetData.metadata || {},
        project_id: assetData.projectId,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      ...assetData,
      userId,
      expiresAt,
      createdAt: { seconds: new Date(data.created_at).getTime() / 1000 },
    };
  },

  /**
   * Gets all non-expired assets for a user.
   */
  async getUserAssets(userId: string, type?: 'image' | 'audio' | 'video') {
    let query = supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Asset Fetch Error:", error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      url: row.url,
      name: row.name,
      prompt: row.prompt,
      metadata: row.metadata,
      projectId: row.project_id,
      expiresAt: row.expires_at,
      createdAt: { seconds: new Date(row.created_at).getTime() / 1000 },
    }));
  },

  /**
   * Deletes an asset
   */
  async deleteAsset(userId: string, assetId: string) {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};
