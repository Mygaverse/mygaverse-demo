export const imageService = {
  /**
   * Generates an image based on the text prompt.
   * @param prompt The image description
   * @param aspect Optional aspect ratio (default 1:1)
   * @param options Optional: char_ref (Flux character anchor), negative_prompt (style negatives)
   */
  async generate(
    prompt: string,
    aspect: string = '1:1',
    options?: { char_ref?: string; negative_prompt?: string; loras?: string[] }
  ): Promise<string> {
    try {
      const response = await fetch('/api/scriptoplay/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          model: 'fal-ai/flux-pro/v1.1', // Phase 1: Flux Pro until Phase 2 LoRA ships
          prompt,
          aspect_ratio: aspect,
          ...options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Image generation failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Image Service Response:', data);
      if (!data?.url) throw new Error(`Invalid Orchestrator Response: ${JSON.stringify(data)}`);
      return data.url;
    } catch (error) {
      console.error('Image Service Error:', error);
      throw error;
    }
  }
};
