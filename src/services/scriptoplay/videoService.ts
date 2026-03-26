export const videoService = {

  /**
   * Starts a video generation task (Text-to-Video or Image-to-Video)
   * Phase 1: Routes to LTX-2 by default (fast, open-source, on Fal GPU cluster)
   */
  async generateVideo(
    prompt: string,
    imageUrl?: string,
    audioUrl?: string,
    tags: string[] = [],
    modelTier: 'tier1' | 'tier2' | 'tier3' | 'tier4' = 'tier1',
    imageEndUrl?: string,
    duration?: string | number,
    loraUrl?: string,
    targetModel?: string, // "kling", "wan", or "ltx"
    seed?: number, // Phase 3 Momentum Buffer
    onStatusUpdate?: (status: string) => void
  ) {
    try {
      let selectedModel = '';
      const tModel = (targetModel || '').toLowerCase();

      // DYNAMIC PERSONA OVERRIDE
      if (tModel === 'kling') {
        selectedModel = imageUrl ? 'fal-ai/kling-video/v1.6/pro/image-to-video' : 'fal-ai/kling-video/v1.6/pro/text-to-video';
      } else if (tModel === 'wan') {
        // Upgrade to Wan 2.1 (using Fal.ai verified aliases)
        selectedModel = imageUrl ? 'fal-ai/wan-i2v' : 'fal-ai/wan-t2v';
      } else if (tModel === 'ltx') {
        selectedModel = imageUrl ? 'fal-ai/ltx-video/image-to-video' : 'fal-ai/ltx-video';
      } else if (modelTier === 'tier1') {
        // Fast & Cheap, but LTX is deprecated for this pipeline per user request. Use Wan V1.4.
        selectedModel = imageUrl ? 'fal-ai/wan-i2v' : 'fal-ai/wan-t2v';
      } else if (modelTier === 'tier2') {
        // High Quality: Kling Pro or Minimax
        selectedModel = imageUrl ? 'fal-ai/minimax/video-01' : 'fal-ai/kling-video/v1.6/pro/text-to-video';
      } else if (modelTier === 'tier3') {
        // Medium Quality
        selectedModel = imageUrl ? 'fal-ai/kling-video/v1.6/standard/image-to-video' : 'fal-ai/kling-video/v1.6/standard/text-to-video';
      } else if (modelTier === 'tier4') {
        // Experimental / Emerging models
        selectedModel = imageUrl ? 'fal-ai/luma-dream-machine/image-to-video' : 'fal-ai/luma-dream-machine';
      } else {
        selectedModel = imageUrl ? 'fal-ai/ltx-video/image-to-video' : 'fal-ai/ltx-video';
      }

      console.log(`Video Smart Routing: ${modelTier} -> ${selectedModel} (Seed: ${seed || 'Random'})`);

      const response = await fetch('/api/scriptoplay/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          model: selectedModel,
          prompt,
          image_url: imageUrl,
          image_end_url: imageEndUrl,
          duration,
          aspect_ratio: '16:9',
          loras: loraUrl ? [loraUrl] : undefined,
          seed
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errData: any = {};
        try { errData = JSON.parse(errText); } catch { errData = { error: errText }; }
        console.error('Video Service Error:', response.status, errData);
        throw new Error(errData.error || `Failed to start video generation (${response.status})`);
      }

      const data = await response.json();
      console.log('Video Service Response:', data);

      if (data.requestId) {
        console.log(`Video Generation Queued (ID: ${data.requestId}, Model: ${data.model}). Polling...`);
        return await this.pollForVideo(data.requestId, data.model, onStatusUpdate);
      }

      if (!data?.url) throw new Error(`Invalid Orchestrator Response: ${JSON.stringify(data)}`);
      return data.url;
    } catch (error) {
      console.error('Video Service Start Error:', error);
      throw error;
    }
  },

  /**
   * Polls the status endpoint until video is ready
   * LTX-2 generates in ~10-30s; poll every 5s (max 3 min)
   */
  async pollForVideo(requestId: string, modelId?: string, onStatusUpdate?: (status: string) => void) {
    const maxAttempts = 120; // 5s * 120 = 10 mins (Covers heavy queues for Wan/Kling)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000)); // 5s poll

      try {
        const statusParams = await this.checkStatus(requestId, modelId);
        const currentStatus = (statusParams.status || '').toLowerCase();
        
        if (onStatusUpdate) {
          onStatusUpdate(currentStatus);
        }

        console.log(`Video Poll Status [${requestId}] (${i + 1}/${maxAttempts}): ${currentStatus}`);

        if (currentStatus === 'completed' && statusParams.url) {
          if (typeof statusParams.url !== 'string') {
            console.error("CRITICAL: Poll URL is not a string:", statusParams.url);
            throw new Error("Invalid URL format received from polling");
          }
          console.log("Video Polling Complete. Returning URL:", statusParams.url);
          return statusParams.url;
        }
        
        if (currentStatus === 'failed' || currentStatus === 'error') {
          throw new Error(statusParams.error || "Video Generation Failed");
        }
      } catch (e) {
        console.warn("Poll attempt failed, retrying...", e);
      }
    }
    throw new Error("Video Generation Timed Out after 10 minutes. The model might be experiencing high traffic.");
  },

  /**
   * Checks the status of a generation
   * Returns full status object: { state: 'completed'|'dreaming'|'failed', assets: { video: 'url' }, ... }
   */
  async checkStatus(requestId: string, modelId?: string) {
    try {
      const response = await fetch('/api/scriptoplay/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status',
          requestId,
          modelId
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Video Service Status Failed:", response.status, errText);
        throw new Error(`Failed to check status: ${response.status} ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Video Service Status Error:", error);
      throw error;
    }
  }

};
