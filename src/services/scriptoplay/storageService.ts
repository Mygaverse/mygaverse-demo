
import { createClient } from '@/lib/scriptoplay/supabase/client';

const supabase = createClient();
const BUCKET = 'user-assets'; // Make sure this bucket exists in Supabase!

export const storageService = {
  /**
   * Uploads a file to Supabase Storage
   * @param path The storage path (e.g., "users/123/assets/image.png")
   * @param file The file or blob to upload
   * @returns The public URL
   */
  async uploadFile(path: string, file: Blob | File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: true
      });

    if (error) {
      console.error("Storage Upload Error:", error);
      throw error;
    }

    // Get Public URL
    const { data: publicDist } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return publicDist.publicUrl;
  },

  /**
   * Deletes a file from Supabase Storage
   */
  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) throw error;
  },

  /**
   * Uploads from a URL (e.g. DALL-E) via Proxy
   */
  async uploadFromUrl(path: string, url: string): Promise<string> {
    try {
      // Use our own proxy to avoid CORS issues
      const proxyUrl = `/api/scriptoplay/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Proxy fetch failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      return await this.uploadFile(path, blob);
    } catch (error) {
      console.error("Error uploading from URL:", error);
      throw error;
    }
  }
};
