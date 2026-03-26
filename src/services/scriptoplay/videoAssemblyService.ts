import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { storageService } from '@/services/scriptoplay/storageService';

class VideoAssemblyService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  /**
   * Loads the FFmpeg core from unpkg CDN to bypass Next.js Webpack and CORS limits.
   */
  async load(onProgress?: (ratio: number) => void) {
    if (this.isLoaded && this.ffmpeg) return;

    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
    }

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress);
      });
    }

    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg Log]', message);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    console.log("Loading FFmpeg core...");
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.isLoaded = true;
    console.log("FFmpeg loaded successfully.");
  }

  /**
   * Assembles the final video using FFmpeg.
   * Downloads assets to virtual memory, applies the sidechain ducking, and exports.
   */
  async assembleVideo(config: {
    projectId: string;
    scenes: any[];
    bgmUrl?: string;
    vfx?: { filmGrain?: boolean; vignette?: boolean };
    onProgress?: (msg: string, ratio?: number) => void;
  }): Promise<string | null> {
    const { projectId, scenes, bgmUrl, vfx, onProgress } = config;

    if (!this.ffmpeg || !this.isLoaded) {
      await this.load((ratio) => onProgress?.("Loading FFmpeg Engine...", ratio));
    }

    const ff = this.ffmpeg!;

    try {
      onProgress?.('Downloading assets to memory...', 0);

      // 1. Download all video clips
      const videoFiles: string[] = [];
      const voiceFiles: string[] = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        // Skip scenes that don't have video
        if (!scene.production_video) continue;

        const videoFileName = `vid_${i}.mp4`;
        onProgress?.(`Downloading Scene ${i + 1} Video...`);
        await ff.writeFile(videoFileName, await fetchFile(scene.production_video));
        videoFiles.push(videoFileName);

        // Download Dialogue if it exists
        const audioUrl = scene.dialogue?.[0]?.audio_url;
        if (audioUrl) {
          const voiceFileName = `voice_${i}.mp3`;
          onProgress?.(`Downloading Scene ${i + 1} Audio...`);
          await ff.writeFile(voiceFileName, await fetchFile(audioUrl));
          voiceFiles.push(voiceFileName);
        } else {
          // Create a 1-second silent audio file as padding if no voice exists to keep array lengths matching?
          // Complex filters are tricky if lengths mismatch. 
          // For MVP, lets just push null and we'll handle gaps.
          voiceFiles.push('');
        }
      }

      let bgmFileName = '';
      if (bgmUrl) {
        bgmFileName = 'bgm.mp3';
        onProgress?.(`Downloading Soundtrack...`);
        await ff.writeFile(bgmFileName, await fetchFile(bgmUrl));
      }

      // 2. Map Inputs and Build Concat Filter
      let filterComplex = '';
      const args: string[] = [];
      let inputIdx = 0;
      let concatSegments = '';

      // We need to ensure all audio inputs are explicitly normalized to stereo and 44100Hz 
      // otherwise concat will crash if different voice models have different sample rates.

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (!scene.production_video) continue;

        const videoFileName = `vid_${i}.mp4`;

        args.push('-i', videoFileName);
        const vIdx = inputIdx++;

        const audioUrl = scene.dialogue?.[0]?.audio_url;
        let aIdx = -1;

        if (audioUrl) {
          const voiceFileName = `voice_${i}.mp3`;
          args.push('-i', voiceFileName);
          aIdx = inputIdx++;
        } else {
          // Provide a dummy silent track that acts as a placeholder
          // The -t 10 is just a cap, the 'shortest' behavior of concat will trim it to video length
          args.push('-f', 'lavfi', '-t', '100', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
          aIdx = inputIdx++;
        }

        // Normalize this scene's audio before concatenating
        filterComplex += `[${aIdx}:a]aformat=sample_rates=44100:channel_layouts=stereo[a_norm_${i}]; `;
        concatSegments += `[${vIdx}:v][a_norm_${i}]`;
      }

      const numScenes = scenes.filter(s => s.production_video).length;
      filterComplex += `${concatSegments}concat=n=${numScenes}:v=1:a=1[v_concat][a_main]; `;

      // Apply VFX to the concatenated video branch
      // We start from [v_concat] and potentially chain into [v_out]
      const lastVNode = 'v_concat';

      if (vfx?.filmGrain && vfx?.vignette) {
        // Both VFX
        filterComplex += `[${lastVNode}]noise=alls=20:allf=t+u, vignette=PI/4[v_out]; `;
      } else if (vfx?.filmGrain) {
        filterComplex += `[${lastVNode}]noise=alls=20:allf=t+u[v_out]; `;
      } else if (vfx?.vignette) {
        filterComplex += `[${lastVNode}]vignette=PI/4[v_out]; `;
      } else {
        // Pass through
        filterComplex += `[${lastVNode}]copy[v_out]; `;
      }

      // Add BGM
      if (bgmUrl) {
        const bgmFileName = 'bgm.mp3';
        args.push('-i', bgmFileName);
        const bgmIdx = inputIdx++;

        // Normalize BGM
        filterComplex += `[${bgmIdx}:a]aformat=sample_rates=44100:channel_layouts=stereo[bgm_norm]; `;

        filterComplex += `[a_main]asplit=2[voice_main][sc]; `;
        filterComplex += `[bgm_norm][sc]sidechaincompress=threshold=0.03:ratio=10:attack=50:release=500[bgm_ducked]; `;
        filterComplex += `[voice_main][bgm_ducked]amix=inputs=2:duration=first[audio_final]`;
      } else {
        filterComplex += `[a_main]anull[audio_final]`;
      }

      onProgress?.('Executing FFmpeg Assembly...', 30);

      // 4. Build Command Execution Array
      // We pass the args directly to prevent regex parsing errors on quotes and spaces
      const execArgs = [
        ...args,
        '-filter_complex', filterComplex,
        '-map', '[v_out]',
        '-map', '[audio_final]',
        '-c:v', 'libx264', '-preset', 'veryfast',
        '-c:a', 'aac', '-b:a', '192k',
        'output.mp4'
      ];

      console.log("Running FFmpeg with args:", execArgs);

      const execCode = await ff.exec(execArgs);
      console.log(`FFmpeg exited with code ${execCode}`);

      if (execCode !== 0) {
        throw new Error(`FFmpeg execution failed with code ${execCode}`);
      }

      onProgress?.('Verifying Output Video...', 90);

      // Check if output.mp4 exists in the virtual filesystem before reading
      const dirContents = await ff.listDir('/');
      const outputExists = dirContents.some((f) => f.name === 'output.mp4');

      if (!outputExists) {
        throw new Error("FFmpeg completed but output.mp4 was not found in the virtual filesystem. Check the filter_complex syntax.");
      }

      onProgress?.('Uploading Final Video...', 95);

      // 5. Read output and upload
      const data = await ff.readFile('output.mp4');
      const blob = new Blob([data as any], { type: 'video/mp4' });

      // Upload to Supabase Storage
      const fileName = `projects/${projectId}/final_render_${Date.now()}.mp4`;

      const publicUrl = await storageService.uploadFile(fileName, blob);

      onProgress?.('Done!', 100);
      return publicUrl;

    } catch (e) {
      console.error("FFmpeg Assembly Error:", e);
      throw e;
    }
  }

  /**
   * Helper to natively probe video duration in the browser before ffmpeg processes it.
   */
  private async getVideoDuration(url: string, fallbackDir: number = 10): Promise<number> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(fallbackDir);
        return;
      }
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(video.duration || fallbackDir);
      video.onerror = () => resolve(fallbackDir);
      video.src = url;
    });
  }

  /**
   * Fast, single-take muxing for the Hobbyist 'Lite' pipeline.
   * Overlays the dialogue audio and soundtrack onto the generated video.
   */
  async muxHobbyistVideo(videoUrl: string, audioUrl: string | undefined, bgmUrl: string | undefined, projectId: string, onProgress?: (msg: string) => void): Promise<string> {
    if (!audioUrl && !bgmUrl) return videoUrl; // No audio = return silent video

    if (!this.ffmpeg || !this.isLoaded) {
      await this.load((ratio) => onProgress?.("Loading FFmpeg Engine... " + Math.round(ratio * 100) + "%"));
    }

    const ff = this.ffmpeg!;

    try {
      onProgress?.('Downloading video and audio assets...');
      await ff.writeFile('video.mp4', await fetchFile(videoUrl));

      const execArgs: string[] = ['-i', 'video.mp4'];
      let filterComplex = '';
      let currentAudioInputIndex = 1; // Index for the first audio stream after video (0)

      let dialogueInput = -1;
      let bgmInput = -1;

      if (audioUrl) {
        await ff.writeFile('audio.mp3', await fetchFile(audioUrl));
        execArgs.push('-i', 'audio.mp3');
        dialogueInput = currentAudioInputIndex++;
      }

      if (bgmUrl) {
        await ff.writeFile('bgm.mp3', await fetchFile(bgmUrl));
        execArgs.push('-i', 'bgm.mp3');
        bgmInput = currentAudioInputIndex++;
      }

      onProgress?.('Mixing Stereo Audio and Muxing Video...');

      // FFmpeg WebAssembly has severe OOM buffer crashing issues when using `-shortest` with `-c:v copy`.
      // By natively probing the video duration first, we can use the explicit `-t` command to truncate seamlessly.
      const duration = await this.getVideoDuration(videoUrl);
      const targetDurationStr = String(duration);

      if (dialogueInput !== -1 && bgmInput !== -1) {
        // Both dialogue and BGM are present.
        // Resample to 44.1kHz Stereo to prevent amix format mismatch.
        // REMOVED 'apad': generating infinite audio in WebAssembly causes OOM (Out of Memory) buffer crashes when paired with stream copying.
        filterComplex = `[${dialogueInput}:a]aformat=sample_rates=44100:channel_layouts=stereo[voice]; ` +
          `[${bgmInput}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.25[bgm]; ` +
          `[voice][bgm]amix=inputs=2:duration=longest[audio_final]`;

        execArgs.push(
          '-filter_complex', filterComplex,
          '-map', '0:v:0',
          '-map', '[audio_final]',
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-t', targetDurationStr,
          'muxed.mp4'
        );
      } else if (dialogueInput !== -1) {
        // Only dialogue: bypass filter_complex to prevent syntax crashes
        execArgs.push(
          '-map', '0:v:0',
          '-map', `${dialogueInput}:a:0`,
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-t', targetDurationStr,
          'muxed.mp4'
        );
      } else if (bgmInput !== -1) {
        // Only BGM
        filterComplex = `[${bgmInput}:a]volume=0.35[audio_final]`;
        execArgs.push(
          '-filter_complex', filterComplex,
          '-map', '0:v:0',
          '-map', '[audio_final]',
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-t', targetDurationStr,
          'muxed.mp4'
        );
      }

      console.log("Running FFmpeg Mux with args:", execArgs);
      const execCode = await ff.exec(execArgs);

      if (execCode !== 0) {
        console.error(`FFmpeg mux execution failed with code ${execCode}`);
        return videoUrl; // Fallback to silent video if mux fails
      }

      onProgress?.('Uploading Synced Final Video...');
      const data = await ff.readFile('muxed.mp4');
      const blob = new Blob([data as any], { type: 'video/mp4' });
      const fileName = `projects/${projectId}/hobbyist_muxed_${Date.now()}.mp4`;

      return await storageService.uploadFile(fileName, blob);
    } catch (e) {
      console.error("FFmpeg Mux Error:", e);
      return videoUrl; // Fallback to silent video on failure
    }
  }
}

export const videoAssemblyService = new VideoAssemblyService();
