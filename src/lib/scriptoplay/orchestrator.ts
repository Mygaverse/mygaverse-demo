import { fal } from "@fal-ai/client";
import Replicate from "replicate";

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Configure Fal
fal.config({
  credentials: process.env.FAL_KEY,
});

if (!process.env.FAL_KEY) {
  console.warn("Orchestrator Warning: FAL_KEY is missing from environment variables.");
}

export type ModelType = 'image' | 'video' | 'audio';

export interface GenerationParams {
  prompt: string;
  model?: string;
  [key: string]: any;
}

export const orchestrator = {

  async generateImage(params: GenerationParams) {
    const { prompt, model, aspect_ratio, char_ref, negative_prompt, loras } = params;

    // Phase 1: Flux Pro v1.1 as primary (best quality until Phase 2 LoRA ships)
    // SD 3.5 Large is the Phase 2 target — will default once LoRA training is ready
    const primaryModel = model || 'fal-ai/flux-pro/v1.1';
    const fallbackModel = 'fal-ai/flux/dev';

    const errors: any[] = [];

    const generateWithModel = async (modelId: string) => {
      console.log(`Orchestrator: Attempting image generation with ${modelId}`);
      try {
        const input: any = {
          prompt,
          image_size: aspect_ratio === '16:9' ? 'landscape_16_9' : 'square_hd',
          safety_tolerance: '2',
          // Native negative_prompt API param (no --no flags in text)
          ...(negative_prompt && { negative_prompt }),
          // Flux char_ref for character consistency anchoring
          ...(char_ref && { char_ref }),
          // Phase 2: LoRA weights injection — silently applied when trained LoRAs are available
          ...(loras?.length > 0 && {
            loras: loras.map((url: string) => ({ path: url, scale: 0.9 }))
          }),
        };

        const result: any = await fal.subscribe(modelId, {
          input,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              update.logs?.map((log: any) => log.message).forEach(console.log);
            }
          },
        });
        return { success: true, data: result };
      } catch (e: any) {
        console.warn(`Orchestrator: Error with ${modelId}`, e);
        errors.push(`${modelId}: ${e.message || JSON.stringify(e)}`);
        return { success: false, error: e };
      }
    };

    try {
      let attempt = await generateWithModel(primaryModel);
      let result = attempt.data;

      const hasImage = (res: any) => {
        if (!res) return false;
        if (res.images?.length > 0) return true;
        if (res.data?.images?.length > 0) return true;
        if (res.image?.url) return true;
        return false;
      };

      if (!attempt.success || !hasImage(result)) {
        console.warn(`Orchestrator: ${primaryModel} failed. Falling back to ${fallbackModel}...`);
        const fallbackAttempt = await generateWithModel(fallbackModel);
        if (fallbackAttempt.success && hasImage(fallbackAttempt.data)) {
          result = fallbackAttempt.data;
        }
      }

      console.log('Orchestrator Image Result:', JSON.stringify(result, null, 2));

      if (result?.images?.length > 0) return result.images[0].url;
      if (result?.data?.images?.length > 0) return result.data.images[0].url;
      if (result?.image?.url) return result.image.url;
      if (result?.url) return result.url;

      const debugInfo = result ? JSON.stringify(result, null, 2).substring(0, 500) : 'No result';
      throw new Error(`Image generation failed. Errors: [${errors.join(' | ')}]. Debug: ${debugInfo}`);
    } catch (error) {
      console.error('Orchestrator Image Fatal Error:', error);
      throw error;
    }
  },

  async generateVideo(params: GenerationParams) {
    const { prompt, model, image_url, image_end_url, duration, aspect_ratio, loras, seed } = params;

    const videoModel = model || 'fal-ai/ltx-video';
    const isLTX = videoModel.includes('ltx-video');
    const isKling = videoModel.includes('kling-video');
    const isMinimax = videoModel.includes('minimax');
    const isLuma = videoModel.includes('luma');
    const isWan = videoModel.includes('wan');

    try {
      const input: any = { prompt };

      if (seed !== undefined) {
        input.seed = seed;
      }

      if (isLTX) {
        input.negative_prompt = 'worst quality, inconsistent motion, blurry, jittery, distorted, watermark, text';
        if (image_url) {
          // image-to-video: resolution derived from input image, aspect_ratio not accepted
          input.image_url = image_url;
        } else {
          // text-to-video: aspect_ratio controls output dimensions
          input.aspect_ratio = aspect_ratio || '16:9';
        }
        // LTX-Video uses num_frames (must be N*8+1: 25,33,41,...,257)
        // ~25fps output: 5s≈121 frames, 3s≈73 frames, 8s≈193 frames
        if (duration) {
          const dNum = parseInt(String(duration), 10);
          const clampedSecs = Math.min(Math.max(dNum, 2), 10);
          const rawFrames = Math.round(clampedSecs * 24);
          // Round to nearest valid N*8+1
          input.num_frames = Math.round((rawFrames - 1) / 8) * 8 + 1;
        } else {
          input.num_frames = 97; // ~4 seconds
        }
        if (loras && loras.length > 0) {
          input.loras = loras.map((url: string) => ({ path: url, scale: 0.85 }));
        }
      } else if (isKling) {
        input.negative_prompt = 'blurry, poor quality, watermark, weird physics';
        input.aspect_ratio = aspect_ratio || '16:9';
        if (image_url) input.image_url = image_url;
        input.duration = "5"; // Kling strictly requires string "5" or "10"
      } else if (isMinimax) {
        if (image_url) input.image_url = image_url;
        input.prompt_optimizer = true; // Recommended by Minimax
      } else if (isLuma) {
        if (image_url) input.image_url = image_url;
        if (image_end_url) input.image_end_url = image_end_url;
        input.aspect_ratio = aspect_ratio || '16:9';
      } else if (isWan) {
        input.aspect_ratio = aspect_ratio || '16:9';
        if (image_url) {
          input.image_url = image_url;
        }
      }

      console.log('Orchestrator Video Input:', JSON.stringify({ model: videoModel, input }, null, 2));

      const result: any = await fal.queue.submit(videoModel, { input });

      console.log('Orchestrator Video Submitted:', result);

      return {
        requestId: result.request_id,
        model: videoModel,
        status: 'queued',
        message: 'Generation started. Please poll for status.'
      };

    } catch (error) {
      console.error('Orchestrator Video Error:', error);
      throw error;
    }
  },

  async checkStatus(requestId: string, modelId?: string) {
    try {
      // Fix types for fal.queue.status
      // If modelId is provided, use likely signature: fal.queue.status(modelId, requestId, ...)
      // Based on error "Invalid app id", the first arg MUST be the app/model ID.
      let status: any;
      if (modelId) {
        // Try multiple signatures for fal.queue.status with modelId
        try {
          // Attempt 1: Standard object with requestId
          status = await fal.queue.status(modelId, { requestId, logs: true } as any);
        } catch (e) {
          console.warn("Attempt 1 failed, trying request_id...");
          try {
            // Attempt 2: Object with request_id (snake_case)
            status = await fal.queue.status(modelId, { request_id: requestId, logs: true } as any);
          } catch (e2) {
            console.warn("Attempt 2 failed, trying direct arg...");
            // Attempt 3: Just the requestId as 2nd arg (unlikely but possible)
            status = await fal.queue.status(modelId, requestId as any);
          }
        }
      } else {
        // Fallback for backward compat or if model not provided (though it should be)
        status = await fal.queue.status(requestId, { logs: true } as any);
      }

      console.log(`Orchestrator Status [${requestId}]:`, status.status);

      if (status.status === 'COMPLETED' || (status.logs && status.logs.some((l: any) => l.message === 'Completed'))) {
        // Many Fal models return the result IN the status check if logs are requested
        // Or we might need to call result(), but let's check status payload first.
        // It's possible status.response_url or similar exists.

        console.log("Orchestrator Status Payload (DEBUG):", JSON.stringify(status, null, 2));

        // Attempt to extract URL from status first (some models do this)
        let url = null;
        const findUrl = (obj: any): string | null => {
          if (!obj) return null;

          // Match video string URLs — including Fal CDN URLs (no .mp4 extension required)
          if (typeof obj === 'string' && obj.startsWith('http')) {
            const isVideoUrl =
              obj.includes('.mp4') ||
              obj.includes('.mov') ||
              obj.includes('.webm') ||
              obj.includes('fal.media') ||     // Fal CDN
              obj.includes('fal-cdn') ||        // Fal CDN alt
              obj.includes('fal-storage') ||    // Fal storage
              obj.includes('cdn.fal.run');      // Fal run CDN
            if (isVideoUrl) return obj;
          }

          if (typeof obj === 'object') {
            // LTX-Video and similar: { video: { url: "..." } }
            if (obj.video?.url && typeof obj.video.url === 'string') return obj.video.url;
            // LTX-Video alt format: { videos: [{ url: "..." }] }
            if (Array.isArray(obj.videos) && obj.videos[0]?.url) return obj.videos[0].url;
            // Generic: { url: "..." }
            if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
            // Recursive search in all object keys
            for (const k in obj) {
              if (k === 'logs' || k === 'metrics') continue; // Skip noisy fields
              const found = findUrl(obj[k]);
              if (found) return found;
            }
          }
          return null;
        };

        url = findUrl(status);

        // If status has a response_url, fetch it directly!
        if (status.response_url) {
          console.log("Orchestrator: Fetching response_url:", status.response_url);
          try {
            // Use a direct fetch with the same credentials header if needed, 
            // but usually these are signed or public if the job is done. 
            // Actually fal.queue.result does this but it might be failing on signature.
            // Let's try to just return the response_url if we are lazy? 
            // No, we need the video URL inside it.

            // Let's try to map 'response_url' to the result.
            // If we can't fetch it here easily without auth, we might fallback.
            // But wait, the SDK should handle this. 

            // HYPOTHESIS: The SDK 'result' call is failing because of signature mismatch or similar.
            // Let's rely on the SDK's `fal.queue.result` BUT check the arguments.

            // ACTUALLY: The log shows "inference_time": 0.19s. 
            // This means Luma might have failed to generate a video and just "completed" the process?
            // Or it returned a result elsewhere. 

            // Let's try to just Return the status if it has a response_url 
            // and let the client (or a second fetch) handle it? 
            // No, orchestrator must return the video URL.

            // Fix: Fetch the response_url using the standard fetch with API Key
            const resp = await fetch(status.response_url, {
              headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`,
                'Content-Type': 'application/json'
              }
            });

            if (resp.ok) {
              const json = await resp.json();
              console.log("Orchestrator: Fetched Response Data:", JSON.stringify(json, null, 2));
              url = findUrl(json);
            } else {
              console.warn("Orchestrator: Failed to fetch response_url", resp.status);
            }
          } catch (e) {
            console.error("Orchestrator: Error fetching response_url", e);
          }
        }

        // If not found in status/response_url, try standard result() call ONCE
        if (!url) {
          console.log("URL not in status/response, calling result()...");
          try {
            let result: any;
            try {
              result = await fal.queue.result(modelId || "fal-ai/luma-dream-machine", { requestId } as any);
            } catch (e1) {
              console.warn("Result Attempt 1 failed, trying request_id...");
              try {
                result = await fal.queue.result(modelId || "fal-ai/luma-dream-machine", { request_id: requestId } as any);
              } catch (e2) {
                console.warn("Result Attempt 2 failed, trying direct arg...");
                result = await fal.queue.result(modelId || "fal-ai/luma-dream-machine", requestId as any);
              }
            }
            console.log("Orchestrator Result Payload:", JSON.stringify(result, null, 2));
            url = findUrl(result);
          } catch (e: any) {
            console.error("Orchestrator Result Call Failed:", e.message);
            if (status.response_url) {
              console.warn("Returning response_url as fallback/debug info");
            }
          }
        }

        if (url) {
          console.log("Orchestrator Final URL:", url);
          return { status: 'completed', url, result: status };
        }

        // COMPLETED but no URL means the model itself failed (e.g. 422 bad input)
        // Check logs for error signals to surface a useful message
        const errorLog = status.logs?.find((l: any) =>
          l.message?.includes('422') || l.message?.includes('Error') || l.message?.includes('error')
        );
        const errorMsg = errorLog?.message || 'Generation completed but produced no output. The model may have rejected the input.';
        console.warn("Orchestrator: Completed but NO URL found.", errorMsg);
        return { status: 'failed', error: errorMsg };
      }

      // Handle Error State (check both status string and error property)
      if (status.status === 'FAILED' || status.status === 'ERROR' || status.error) {
        return { status: 'failed', error: status.error || "Unknown Failure" };
      }

      return { status: status.status, logs: status.logs };
    } catch (e: any) {
      console.error("Orchestrator SDK Status Check Failed:", e);
      throw e;
    }
  },

  async generateAudio(params: GenerationParams): Promise<ArrayBuffer> {
    const { prompt, text, voice, model } = params;

    if (model === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OpenAI API Key missing — add OPENAI_API_KEY to .env.local");

      // Guard: OpenAI rejects empty input with a cryptic 400
      if (!text || text.trim() === '') {
        throw new Error("TTS input text is empty. Make sure the dialogue line has content.");
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice || "alloy",
          speed: params.speed || 1.0,
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        // Safe parse — OpenAI sometimes returns non-JSON on network errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI TTS failed (${response.status}): ${errorData?.error?.message || response.statusText || 'Unknown error'}`
        );
      }

      return await response.arrayBuffer();

    } else if (model === 'elevenlabs') {
      // ElevenLabs voice map → OpenAI fallback (used when free plan 402s)
      const ELEVEN_TO_OPENAI: Record<string, string> = {
        '21m00Tcm4TlvDq8ikWAM': 'nova',    // Rachel
        'AZnzlk1XvdvUeBnXmlld': 'nova',    // Domi
        'EXAVITQu4vr4xnSDxMaL': 'shimmer', // Bella
        'MF3mGyEYCl7XYWbV9V6O': 'shimmer', // Elli
        'TxGEqnHWrfWFTfGW9XjX': 'echo',    // Josh
        'VR6AewLTigWg4xSOukaG': 'onyx',    // Arnold
        'pNInz6obpgDQGcFmaJgB': 'onyx',    // Adam
        'ErXwobaYiN019PkySvjV': 'alloy',   // Antoni
        'yoZ06aMxZJJ28mfd3POQ': 'echo',    // Sam
        'flq6f7yk4E4fJM5XTYuZ': 'onyx',   // Michael
      };

      const apiKey = process.env.ELEVENLABS_API_KEY;

      if (apiKey) {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        });

        if (response.ok) {
          return await response.arrayBuffer();
        }

        // 402 = free plan cannot use library voices → fall back to OpenAI silently
        if (response.status === 402) {
          const fallbackVoice = ELEVEN_TO_OPENAI[voice || ''] || 'alloy';
          console.warn(`[orchestrator] ElevenLabs 402 for voice "${voice}" — falling back to OpenAI "${fallbackVoice}"`);
          // Recurse into OpenAI path
          return orchestrator.generateAudio({ ...params, model: 'openai', voice: fallbackVoice });
        }

        const errorText = await response.text();
        throw new Error(`ElevenLabs generation failed: ${response.status} - ${errorText}`);
      }

      // No ElevenLabs key — fall back to OpenAI mapped voice
      const fallbackVoice = ELEVEN_TO_OPENAI[voice || ''] || 'alloy';
      console.warn(`[orchestrator] No ELEVENLABS_API_KEY — falling back to OpenAI "${fallbackVoice}"`);
      return orchestrator.generateAudio({ ...params, model: 'openai', voice: fallbackVoice });

    } else if (model === 'suno') {
      // AceData Suno Integration
      const acedataKey = process.env.ACEDATA_API_KEY;
      if (!acedataKey) throw new Error("AceData API Key missing");

      console.log("Orchestrator: Generating music via AceData Suno...");

      // 1. Create Task
      const createResponse = await fetch("https://api.acedata.cloud/suno/audios", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "authorization": `Bearer ${acedataKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action: "generate",
          prompt: prompt,
          model: "chill"
        })
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        let errJson;
        try {
          errJson = JSON.parse(errText);
        } catch (e) {
          // ignore
        }

        if (errJson?.error?.code === 'used_up' || errText.includes('balance is not sufficient')) {
          throw new Error("ACEDATA_INSUFFICIENT_CREDITS");
        }

        throw new Error(`AceData Suno Creation Failed: ${errText}`);
      }

      const createData = await createResponse.json();
      const taskId = createData.task_id || createData.data?.task_id;

      if (!taskId) {
        // Fallback: check if data is directly returned (unlikely for Suno)
        console.error("AceData Response:", createData);
        throw new Error("No task_id returned from AceData");
      }

      console.log(`Orchestrator: Suno Task ID ${taskId}. Polling...`);

      // 2. Poll for Completion (Max 300s = 5 mins)
      const maxAttempts = 75; // 4s interval * 75 = 300s
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 4000)); // Wait 4s

        const pollResponse = await fetch(`https://api.acedata.cloud/suno/audios/${taskId}`, {
          method: "GET",
          headers: {
            "accept": "application/json",
            "authorization": `Bearer ${acedataKey}`
          }
        });

        if (!pollResponse.ok) continue;

        const pollData = await pollResponse.json();
        const status = pollData.status || pollData.data?.status; // 'queued', 'working', 'succeeded', 'failed'

        console.log(`Orchestrator: Suno Status: ${status} (Attempt ${i + 1}/${maxAttempts})`);

        if (status === 'succeeded' || status === 'success') {
          const resultData = pollData.data || pollData;
          // Suno usually returns 2 audios. We pick the first one.
          const audioUrl = resultData.audio_url || (Array.isArray(resultData) ? resultData[0]?.audio_url : null);

          if (audioUrl) {
            console.log("Orchestrator: Suno Audio URL found:", audioUrl);
            const audioResp = await fetch(audioUrl);
            return await audioResp.arrayBuffer();
          }
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(`AceData Suno Task Failed: ${JSON.stringify(pollData)}`);
        }
      }

      throw new Error("AceData Suno Timeout (exceeded 5 mins)");

    } else if (model === 'musicgen') {
      // Fast Fallback: Replicate MusicGen
      // Hash: 7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906
      console.log("Orchestrator: Generating music via Replicate MusicGen...");

      let output;
      try {
        output = await replicate.run(
          "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
          {
            input: {
              prompt,
              model_version: "large",
              duration: 30
            }
          }
        );
      } catch (error: any) {
        console.error("Orchestrator Replicate Error:", error);
        if (error.message?.includes('402') || error.message?.includes('payment')) {
          throw new Error("REPLICATE_INSUFFICIENT_CREDITS");
        }
        throw error;
      }

      // MusicGen returns an audio URI (or array)
      const rawOutput = output as unknown;
      const audioUrl = Array.isArray(rawOutput) ? String(rawOutput[0]) : String(rawOutput);

      // Fetch and return buffer
      const response = await fetch(audioUrl);
      return await response.arrayBuffer();

    } else if (model === 'cassetteai') {
      // Fal.ai CassetteAI — Fast: 30s preview in ~2s, 3min track in ~10s
      // Model ID: CassetteAI/music-generator (case-sensitive, no fal-ai/ prefix)
      console.log("Orchestrator: Generating music via Fal CassetteAI...");
      const duration = params.duration || 30;

      const result: any = await fal.subscribe('CassetteAI/music-generator', {
        input: {
          prompt,
          duration: Math.min(Math.max(duration, 10), 180), // 10s - 3min range per API docs
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs?.map((log: any) => log.message).forEach(console.log);
          }
        },
      });

      console.log('Orchestrator CassetteAI Result:', JSON.stringify(result, null, 2));

      // CassetteAI response: result.data.audio_file.url (confirmed from live response)
      const audioUrl: string | null =
        result?.data?.audio_file?.url ||  // Primary: confirmed response shape
        result?.data?.audio?.url ||
        result?.audio?.url ||
        result?.data?.audio_url ||
        result?.audio_url ||
        null;

      if (!audioUrl) {
        throw new Error(`CassetteAI: No audio URL in response: ${JSON.stringify(result).substring(0, 200)}`);
      }

      const audioResp = await fetch(audioUrl);
      return await audioResp.arrayBuffer();
    }

    throw new Error(`Unsupported audio model: ${model}`);
  }
};
