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

// Max 60 seconds — frame extraction is fast
export const maxDuration = 60;

const BUCKET = 'user-assets';

// ------------------------------------------------------------------
// POST /api/extract-frame
// Body: { videoUrl: string, projectId: string, sceneIndex: number }
// Returns: { frameUrl: string } — public Supabase URL for the PNG
//
// Purpose: True frame chaining for the 15s Hobbyist pipeline.
// Extracts the very last pixel frame of clip N and uploads it as
// the I2V start image for clip N+1. This eliminates visual drift
// between clips — each clip literally starts where the last one ended.
//
// PNG (lossless) is used instead of JPEG to prevent quality degradation
// from compounding across the chain (JPEG artifacts stack each generation).
// ------------------------------------------------------------------
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const tempDir = os.tmpdir();
  const sessionId = crypto.randomUUID();
  const tempFiles: string[] = [];

  try {
    const { videoUrl, projectId, sceneIndex } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    // ---------------------------------------------------------------
    // Step 1: Download the generated video to a temp file
    // ---------------------------------------------------------------
    const videoPath = path.join(tempDir, `${sessionId}_input.mp4`);
    tempFiles.push(videoPath);

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video: ${videoRes.status} ${videoRes.statusText}`);
    }
    const videoBuffer = await videoRes.arrayBuffer();
    fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

    console.log(`[extract-frame] Downloaded clip ${sceneIndex} (${(videoBuffer.byteLength / 1024).toFixed(0)}KB) → ${videoPath}`);

    // ---------------------------------------------------------------
    // Step 2: Extract the last frame using FFmpeg
    // -sseof -0.1  → seek to 0.1s before the end (true last frame, not -0.5)
    // -frames:v 1  → grab exactly ONE frame
    // PNG output   → lossless, zero compression stacking across the chain
    //                JPEG artifacts compound each generation; PNG prevents this.
    // ---------------------------------------------------------------
    const framePath = path.join(tempDir, `${sessionId}_frame.png`);
    tempFiles.push(framePath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .inputOptions(['-sseof', '-0.1'])
        .outputOptions(['-frames:v', '1', '-vf', 'scale=iw:ih'])
        .output(framePath)
        .on('start', (cmd) => console.log(`[extract-frame] FFmpeg cmd: ${cmd}`))
        .on('end', () => {
          console.log(`[extract-frame] Frame extracted → ${framePath}`);
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg frame extraction failed: ${err.message}`));
        })
        .run();
    });

    if (!fs.existsSync(framePath)) {
      throw new Error('FFmpeg produced no output file — the clip may be corrupted or too short.');
    }

    const frameBuffer = fs.readFileSync(framePath);
    console.log(`[extract-frame] Frame size: ${(frameBuffer.byteLength / 1024).toFixed(0)}KB`);

    // ---------------------------------------------------------------
    // Step 3: Upload the PNG to Supabase Storage
    // Path: projects/{projectId}/handoffs/frame_{sceneIndex}_{sessionId}.png
    // Using a sessionId suffix prevents stale cache collisions on regenerate.
    // ---------------------------------------------------------------
    const supabase = createServiceClient();
    const storagePath = `projects/${projectId || 'temp'}/handoffs/frame_${sceneIndex}_${sessionId}.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, frameBuffer, {
        upsert: true,
        contentType: 'image/png',
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    console.log(`[extract-frame] Uploaded PNG handoff frame → ${publicData.publicUrl}`);

    return NextResponse.json({ frameUrl: publicData.publicUrl });

  } catch (error: any) {
    console.error('[extract-frame] ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    // Always clean up temp files — do not leave video/frame debris in /tmp
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {
        // Silent — cleanup failure must never crash the response
      }
    }
  }
}
