/**
 * loraService.ts
 * Client-side service for the Phase 2 LoRA training pipeline.
 * Trainers and admins use this to submit training jobs and poll status.
 * Standard users never interact with this service directly.
 */

export type LoraTrainingStatus = 'idle' | 'training' | 'ready' | 'failed';

export interface LoraRecord {
  lora_url: string;
  lora_trigger: string;
  status: LoraTrainingStatus;
}

export const loraService = {
  /**
   * Submit a LoRA training job for a character.
   * Requires trainer or admin role (enforced server-side).
   * @param imageUrls - Array of approved character image URLs (min 5, ideal 10–20)
   * @param characterName - Human-readable name (e.g. "Pip")
   * @param triggerWord - Short ALL_CAPS token to inject into prompts (e.g. "PIP_CHAR")
   */
  async submitTraining(
    imageUrls: string[],
    characterName: string,
    triggerWord: string
  ): Promise<{ requestId: string; model: string }> {
    const res = await fetch('/api/scriptoplay/train-lora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls, triggerWord, characterName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Training submission failed');
    return data; // { requestId, model, triggerWord, characterName }
  },

  /**
   * Poll training job status.
   * @returns { status, loraUrl? }
   */
  async checkStatus(requestId: string, model?: string): Promise<{ status: LoraTrainingStatus; loraUrl?: string }> {
    const params = new URLSearchParams({ requestId });
    if (model) params.set('model', model);

    const res = await fetch(`/api/scriptoplay/lora-status?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Status check failed');
    return data; // { status: 'training' | 'ready' | 'failed', loraUrl? }
  },

  /**
   * Generate a training clip in LTX-2 19B Pro mode.
   * Internal tool for trainers to create high-quality animation data.
   */
  async generateTrainingClip(params: {
    imageUrl: string;
    prompt: string;
    cameraLora?: 'static' | 'dolly_in' | 'dolly_out' | 'zoom_in' | 'pan_left' | 'pan_right';
    duration?: number; // 2–4s
  }): Promise<{ requestId: string; model: string }> {
    const res = await fetch('/api/scriptoplay/trainer-studio/generate-clip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Clip generation failed');
    return data;
  },

  /**
   * Poll a clip generation job (from Trainer Studio).
   */
  async checkClipStatus(requestId: string): Promise<{ status: 'processing' | 'completed' | 'failed'; videoUrl?: string }> {
    const res = await fetch(`/api/scriptoplay/trainer-studio/generate-clip?requestId=${requestId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Status check failed');
    return data;
  },

  /**
   * Generate a trigger word from a character name.
   * e.g. "Pip the Cat" → "PIP_CAT"
   */
  generateTriggerWord(characterName: string): string {
    return characterName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .join('_')
      .slice(0, 12); // Keep short for prompt budgets
  },
};
