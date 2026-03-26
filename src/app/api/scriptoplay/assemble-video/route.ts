import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/scriptoplay/supabase/service';
import { requireAuth } from '@/lib/scriptoplay/api-auth';

// Use the bundled ffmpeg binary — no system PATH dependency
ffmpeg.setFfmpegPath(installer.path);

// Allow up to 10 minutes for large video assembly (many scenes + BGM)
export const maxDuration = 600;

const BUCKET = 'user-assets';

// ------------------------------------------------------------------
// Helper: download or decode an asset (https:// or data: URI) → temp file
// ------------------------------------------------------------------
async function fetchAsset(urlOrDataUri: string, destPath: string): Promise<void> {
  if (urlOrDataUri.startsWith('data:')) {
    // Ken Burns base64 data URI → decode directly
    const base64 = urlOrDataUri.split(',')[1];
    fs.writeFileSync(destPath, Buffer.from(base64, 'base64'));
  } else {
    // Regular https:// URL → fetch
    const res = await fetch(urlOrDataUri);
    if (!res.ok) throw new Error(`Failed to fetch asset: ${urlOrDataUri} (${res.status})`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
  }
}

// ------------------------------------------------------------------
// Helper: upload buffer to Supabase storage
// ------------------------------------------------------------------
async function uploadToSupabase(filePath: string, storagePath: string): Promise<string> {
  const supabase = createServiceClient();
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { upsert: true, contentType: 'video/mp4' });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicData.publicUrl;
}

// ------------------------------------------------------------------
// POST /api/assemble-video
// Body: { scenes, bgmUrl?, vfx?, projectId }
// ------------------------------------------------------------------
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const tempDir = os.tmpdir();
  const sessionId = crypto.randomUUID();
  const tempFiles: string[] = [];

  try {
    const { scenes, bgmUrl, vfx, projectId, clipDuration: clipDurationParam } = await req.json();

    // clipDuration: seconds per clip. Kling generates 5s clips, LTX/Wan generate 3s clips.
    const clipDuration: number = typeof clipDurationParam === 'number' && clipDurationParam > 0
      ? clipDurationParam
      : 3;

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: 'No scenes provided' }, { status: 400 });
    }

    // Filter to scenes that actually have video
    const validScenes = scenes.filter((s: any) => s.production_video);
    if (validScenes.length === 0) {
      return NextResponse.json({ error: 'No scenes with video found. Generate clips first.' }, { status: 400 });
    }

    console.log(`[Assemble] Starting assembly for ${validScenes.length} scenes (${clipDuration}s each). Session: ${sessionId}`);

    // ---------------------------------------------------------------
    // Step 1: Download all assets to temp files
    // ---------------------------------------------------------------
    interface SceneAsset { scene: any; videoPath: string; audioPath: string | null; }
    const sceneAssets: SceneAsset[] = [];

    for (let i = 0; i < validScenes.length; i++) {
      const scene = validScenes[i];

      const videoPath = path.join(tempDir, `asm_vid_${sessionId}_${i}.mp4`);
      tempFiles.push(videoPath);

      console.log(`[Assemble] Downloading Scene ${i + 1} video...`);
      await fetchAsset(scene.production_video, videoPath);

      let audioPath: string | null = null;
      const audioUrl = scene.dialogue?.[0]?.audio_url;
      if (audioUrl) {
        audioPath = path.join(tempDir, `asm_aud_${sessionId}_${i}.mp3`);
        tempFiles.push(audioPath);
        console.log(`[Assemble] Downloading Scene ${i + 1} audio...`);
        await fetchAsset(audioUrl, audioPath);
      }

      sceneAssets.push({ scene, videoPath, audioPath });
    }

    // Keep track of which scenes have dialogue audio (for the timeline mix in Step 5)
    // Each entry: { sceneIndex, audioPath, delayMs }
    interface DialogueTrack { sceneIndex: number; audioPath: string; delayMs: number; }
    const dialogueTracks: DialogueTrack[] = [];
    for (let i = 0; i < sceneAssets.length; i++) {
      if (sceneAssets[i].audioPath) {
        dialogueTracks.push({
          sceneIndex: i,
          audioPath: sceneAssets[i].audioPath!,
          delayMs: i * clipDuration * 1000, // e.g. scene 2 with 3s clips → delay 3000ms
        });
      }
    }

    let bgmPath: string | null = null;
    if (bgmUrl) {
      bgmPath = path.join(tempDir, `asm_bgm_${sessionId}.mp3`);
      tempFiles.push(bgmPath);
      console.log(`[Assemble] Downloading BGM...`);
      await fetchAsset(bgmUrl, bgmPath);
    }

    // ---------------------------------------------------------------
    // Step 2: Per-scene mux (video + silence → single normalized clip)
    //         Dialogue audio is NOT muxed here — it is mixed as a
    //         delayed overlay in Step 5 so timing is always accurate.
    // ---------------------------------------------------------------
    const muxedPaths: string[] = [];

    for (let i = 0; i < sceneAssets.length; i++) {
      const { videoPath } = sceneAssets[i];
      const muxedPath = path.join(tempDir, `asm_mux_${sessionId}_${i}.mp4`);
      tempFiles.push(muxedPath);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .input('anullsrc=channel_layout=stereo:sample_rate=44100')
          .inputOptions(['-f lavfi'])
          .outputOptions([
            '-map 0:v:0',
            '-map 1:a:0',
            `-t`, String(clipDuration), // Use actual clip duration (3s for LTX/Wan, 5s for Kling)
            '-c:v copy',
            '-c:a aac',
            '-b:a 128k',
            '-shortest',
            '-fflags +shortest',
            '-max_interleave_delta 100M',
            '-y'
          ])
          .on('start', cmdStr => console.log(`[Assemble] Mux scene ${i + 1}:`, cmdStr.substring(0, 100)))
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(muxedPath);
      });

      muxedPaths.push(muxedPath);
    }
    console.log(`[Assemble] Muxed ${muxedPaths.length} clips at ${clipDuration}s each.`);

    // ---------------------------------------------------------------
    // Step 3: Create concat list file
    // ---------------------------------------------------------------
    const concatListPath = path.join(tempDir, `asm_list_${sessionId}.txt`);
    tempFiles.push(concatListPath);
    const concatContent = muxedPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    // ---------------------------------------------------------------
    // Step 4: Concat all scenes into a single timeline
    // ---------------------------------------------------------------
    const concatOutputPath = path.join(tempDir, `asm_concat_${sessionId}.mp4`);
    tempFiles.push(concatOutputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',
          '-preset veryfast',
          '-c:a aac',
          '-b:a 192k',
          '-movflags +faststart',
          '-y'
        ])
        .on('start', cmdStr => console.log('[Assemble] Concat:', cmdStr.substring(0, 100)))
        .on('progress', (p) => console.log(`[Assemble] Concat progress: ${p.percent?.toFixed(1)}%`))
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(concatOutputPath);
    });

    // ---------------------------------------------------------------
    // Step 5: Mix per-scene dialogue (adelay timeline) + BGM
    //
    // Each scene's dialogue is delayed by (sceneIndex × clipDuration × 1000ms) so it
    // plays at exactly the right moment in the final video — no more "first scene only".
    //
    // Input layout:
    //   0 = concat video (with silence audio track from anullsrc)
    //   1..N = dialogue tracks (one per scene that has audio, with adelay applied)
    //   N+1  = BGM (if present)
    // ---------------------------------------------------------------
    const finalOutputPath = path.join(tempDir, `asm_final_${sessionId}.mp4`);
    tempFiles.push(finalOutputPath);

    const hasDialogue = dialogueTracks.length > 0;

    if (hasDialogue || bgmPath) {
      await new Promise<void>((resolve, reject) => {
        let cmd = ffmpeg(concatOutputPath);
        const filterParts: string[] = [];
        const mapOptions: string[] = ['-map 0:v:0'];

        // --- Add each dialogue track as an input with its timestamp delay ---
        dialogueTracks.forEach(({ audioPath, delayMs }, idx) => {
          cmd = cmd.input(audioPath);
          // Input index: concat video is 0, dialogue tracks start at 1
          const inputIdx = idx + 1;
          filterParts.push(`[${inputIdx}:a]adelay=${delayMs}|${delayMs}[d${idx}]`);
        });

        // --- Mix all delayed dialogue tracks into one timeline ---
        let dialogueMixLabel = '';
        if (hasDialogue) {
          if (dialogueTracks.length > 1) {
            const dInputs = dialogueTracks.map((_, idx) => `[d${idx}]`).join('');
            filterParts.push(
              `${dInputs}amix=inputs=${dialogueTracks.length}:duration=first:normalize=0[dialogue_mix]`
            );
            dialogueMixLabel = '[dialogue_mix]';
          } else {
            // Single dialogue track — just rename the label
            filterParts.push(`[d0]acopy[dialogue_mix]`);
            dialogueMixLabel = '[dialogue_mix]';
          }
        }

        // --- BGM input (after all dialogue inputs) ---
        const bgmInputIdx = dialogueTracks.length + 1;
        if (bgmPath) {
          cmd = cmd.input(bgmPath);
        }

        // --- Final mix: dialogue + BGM with sidechain compression ---
        if (hasDialogue && bgmPath) {
          // Sidechain: BGM ducks when dialogue plays
          filterParts.push(
            `${dialogueMixLabel}asplit=2[voice_main][sc]`,
            `[${bgmInputIdx}:a]aformat=sample_rates=44100:channel_layouts=stereo[bgm_norm]`,
            `[bgm_norm][sc]sidechaincompress=threshold=0.03:ratio=10:attack=50:release=500[bgm_ducked]`,
            `[0:a][voice_main][bgm_ducked]amix=inputs=3:duration=first[audio_final]`
          );
        } else if (hasDialogue && !bgmPath) {
          // Dialogue only — mix with silence track from video
          filterParts.push(`[0:a]${dialogueMixLabel}amix=inputs=2:duration=first[audio_final]`);
        } else if (!hasDialogue && bgmPath) {
          // BGM only
          filterParts.push(`[0:a][${bgmInputIdx}:a]amix=inputs=2:duration=first[audio_final]`);
        }

        mapOptions.push('-map [audio_final]');

        cmd
          .complexFilter(filterParts.join('; '))
          .outputOptions([
            ...mapOptions,
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-shortest',
            '-movflags +faststart',
            '-y'
          ])
          .on('start', cmdStr => console.log('[Assemble] Audio Timeline Mix:', cmdStr.substring(0, 120)))
          .on('progress', (p) => console.log(`[Assemble] Audio Mix progress: ${p.percent?.toFixed(1)}%`))
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(finalOutputPath);
      });
    } else {
      // No BGM and no dialogue — copy concat as final
      fs.copyFileSync(concatOutputPath, finalOutputPath);
    }

    // Apply VFX if enabled (film grain / vignette) — final pass
    let vfxOutputPath = finalOutputPath;
    if (vfx?.filmGrain || vfx?.vignette) {
      vfxOutputPath = path.join(tempDir, `asm_vfx_${sessionId}.mp4`);
      tempFiles.push(vfxOutputPath);

      let vfxFilter = '';
      if (vfx.filmGrain && vfx.vignette) {
        vfxFilter = 'noise=alls=20:allf=t+u, vignette=PI/4';
      } else if (vfx.filmGrain) {
        vfxFilter = 'noise=alls=20:allf=t+u';
      } else {
        vfxFilter = 'vignette=PI/4';
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(finalOutputPath)
          .videoFilters(vfxFilter)
          .outputOptions(['-c:a copy', '-movflags +faststart', '-y'])
          .on('error', (err) => reject(err))
          .on('end', () => resolve())
          .save(vfxOutputPath);
      });
    }

    // ---------------------------------------------------------------
    // Step 6: Upload to Supabase storage
    // ---------------------------------------------------------------
    console.log('[Assemble] Uploading to Supabase...');
    // Fixed path per project — re-renders overwrite the previous file (upsert: true)
    // Users should download before re-rendering to avoid losing the previous version.
    const storagePath = `projects/${projectId || 'unknown'}/final_render.mp4`;
    const publicUrl = await uploadToSupabase(vfxOutputPath, storagePath);

    console.log(`[Assemble] Done! Storage: ${storagePath} URL: ${publicUrl}`);
    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('[Assemble] Error:', error);
    return NextResponse.json({ error: error.message || 'Assembly failed' }, { status: 500 });

  } finally {
    // Cleanup all temp files
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}
