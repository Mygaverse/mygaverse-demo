import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Use the bundled ffmpeg binary
ffmpeg.setFfmpegPath(installer.path);

export async function POST(req: Request) {
  try {
    const { videoUrl, audioUrl, bgmUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing videoUrl' }, { status: 400 });
    }

    // Validate URLs before attempting fetch
    const isValidUrl = (url: string | undefined) => {
      if (!url) return false;
      try { new URL(url); return true; } catch { return false; }
    };

    if (!isValidUrl(videoUrl)) {
      return NextResponse.json({ error: `Invalid videoUrl: "${videoUrl}"` }, { status: 400 });
    }

    if (!audioUrl && !bgmUrl) {
      // Nothing to mux
      return NextResponse.json({ url: videoUrl });
    }

    // Validate audio URLs if present
    if (audioUrl && !isValidUrl(audioUrl)) {
      console.warn(`[Server Mux] Invalid audioUrl skipped: "${audioUrl}"`);
    }
    if (bgmUrl && !isValidUrl(bgmUrl)) {
      console.warn(`[Server Mux] Invalid bgmUrl skipped: "${bgmUrl}"`);
    }

    // Use only valid URLs
    const validAudioUrl = isValidUrl(audioUrl) ? audioUrl : undefined;
    const validBgmUrl = isValidUrl(bgmUrl) ? bgmUrl : undefined;

    if (!validAudioUrl && !validBgmUrl) {
      // No valid audio to mux — return video as-is
      return NextResponse.json({ url: videoUrl });
    }

    const tempDir = os.tmpdir();
    const sessionId = crypto.randomUUID();

    const videoPath = path.join(tempDir, `vid_${sessionId}.mp4`);
    const audioPath = validAudioUrl ? path.join(tempDir, `aud_${sessionId}.mp3`) : null;
    const bgmPath = validBgmUrl ? path.join(tempDir, `bgm_${sessionId}.mp3`) : null;
    const outputPath = path.join(tempDir, `out_${sessionId}.mp4`);

    // Helper to download files
    const downloadFile = async (url: string, dest: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
    };

    console.log(`[Server Mux] Downloading assets to ${tempDir}...`);
    await downloadFile(videoUrl, videoPath);
    if (validAudioUrl && audioPath) await downloadFile(validAudioUrl, audioPath);
    if (validBgmUrl && bgmPath) await downloadFile(validBgmUrl, bgmPath);


    console.log(`[Server Mux] Assembling Video with Fluent-FFmpeg...`);

    await new Promise((resolve, reject) => {
      let command = ffmpeg().input(videoPath);

      if (audioPath) command = command.input(audioPath);
      if (bgmPath) command = command.input(bgmPath);

      if (audioPath && bgmPath) {
        // [1:a] is Voice, [2:a] is BGM
        const filterComplex = `[1:a]aformat=sample_rates=44100:channel_layouts=stereo[voice]; ` +
          `[2:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.25[bgm]; ` +
          `[voice][bgm]amix=inputs=2:duration=longest[audio_final]`;

        command
          .complexFilter(filterComplex)
          .outputOptions([
            '-map 0:v:0',
            '-map [audio_final]',
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-shortest'
          ]);
      } else if (audioPath) {
        // Only Voice
        command.outputOptions([
          '-map 0:v:0',
          '-map 1:a:0',
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-shortest'
        ]);
      } else if (bgmPath) {
        // Only BGM
        const filterComplex = `[1:a]volume=0.35[audio_final]`;
        command
          .complexFilter(filterComplex)
          .outputOptions([
            '-map 0:v:0',
            '-map [audio_final]',
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-shortest'
          ]);
      }

      command
        .on('start', (cmd: string) => console.log('[Server Mux] FFmpeg started:', cmd))
        .on('error', (err: any) => {
          console.error('[Server Mux] Error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('[Server Mux] Finished!');
          resolve(true);
        })
        .save(outputPath);
    });

    // Read the final file
    const outputBuffer = fs.readFileSync(outputPath);

    // Clean up temp files
    try {
      fs.unlinkSync(videoPath);
      if (audioPath) fs.unlinkSync(audioPath);
      if (bgmPath) fs.unlinkSync(bgmPath);
      fs.unlinkSync(outputPath);
    } catch (e) { console.error("Cleanup error", e); }

    // Convert to Base64 data URI to return directly to client
    const base64Video = outputBuffer.toString('base64');
    const dataUri = `data:video/mp4;base64,${base64Video}`;

    return NextResponse.json({ url: dataUri });

  } catch (error: any) {
    console.error("Server API Mux Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
