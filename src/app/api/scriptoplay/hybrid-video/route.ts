import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';

// Use the bundled ffmpeg binary
ffmpeg.setFfmpegPath(installer.path);

// FFmpeg requires local files, so we need to download the image first
async function downloadImage(url: string, destPath: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

export async function POST(request: Request) {
  try {
    const { imageUrl, duration = 3, effect = 'zoom_in' } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    // 1. Setup Temporary Directories
    const tempDir = os.tmpdir();
    const sessionId = randomUUID();
    const inputImagePath = path.join(tempDir, `kb_in_${sessionId}.png`);
    const outputVideoPath = path.join(tempDir, `kb_out_${sessionId}.mp4`);

    console.log(`[Ken Burns Engine] Starting processing for ${sessionId}...`);

    // 2. Download Source Image
    await downloadImage(imageUrl, inputImagePath);

    // 3. The "Golden" Cinematic FFmpeg Command via fluent-ffmpeg
    // We scale the image up by 8x internally to prevent pixelation during the zoom,
    // then crop back down to 1080p, applying a creeping zoom of 0.001 per frame.

    let z = 'zoom+0.001';
    let x = '0';
    let y = '0';
    let scale = '1920*8:-1';

    if (effect === 'zoom_out') {
      z = 'min(zoom+0.001,1.5)';
      x = 'iw/2-(iw/zoom/2)';
      y = 'ih/2-(ih/zoom/2)';
    } else if (effect === 'pan_right') {
      scale = '1920*2:-1';
      z = '1.1';
      x = 'x+1';
      y = 'ih/2-(ih/zoom/2)';
    } else if (effect === 'pan_left') {
      scale = '1920*2:-1';
      z = '1.1';
      x = 'max(0, x-1)';
      y = 'ih/2-(ih/zoom/2)';
    }

    const filterComplex = `scale=${scale},zoompan=z='${z}':d=${duration * 24}:x='${x}':y='${y}':s=1920x1080:fps=24`;

    console.log(`[Ken Burns Engine] Executing Fluent-FFmpeg...`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputImagePath)
        .videoFilters(filterComplex)
        .duration(duration)
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-y'
        ])
        .on('start', (cmd) => console.log('[Ken Burns Engine] Command:', cmd))
        .on('error', (err) => {
          console.error('[Ken Burns Engine] FFmpeg Error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('[Ken Burns Engine] FFmpeg Finished.');
          resolve(true);
        })
        .save(outputVideoPath);
    });

    // 4. File is generated locally. Upload to Supabase to prevent massive JSON payloads.
    const videoBuffer = fs.readFileSync(outputVideoPath);

    const { createClient } = await import('@/lib/scriptoplay/supabase/server');
    const supabase = await createClient();

    const storagePath = `temp_drafts/kb_out_${sessionId}.mp4`;
    const { error } = await supabase.storage
      .from('user-assets')
      .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicData } = supabase.storage.from('user-assets').getPublicUrl(storagePath);
    console.log(`[Ken Burns Engine] Success! Uploaded to ${publicData.publicUrl}`);

    // 5. Cleanup
    try {
      if (fs.existsSync(inputImagePath)) fs.unlinkSync(inputImagePath);
      if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
    } catch (cleanupError) {
      console.error('Cleanup warning:', cleanupError);
    }

    return NextResponse.json({ url: publicData.publicUrl });

  } catch (error: any) {
    console.error('[Ken Burns Engine] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate Ken Burns effect' }, { status: 500 });
  }
}
