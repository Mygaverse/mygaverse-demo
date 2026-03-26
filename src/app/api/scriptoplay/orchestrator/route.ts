import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/scriptoplay/orchestrator';
import { requireAuth } from '@/lib/scriptoplay/api-auth';

// Allow up to 120s for music generation (CassetteAI + MusicGen can take time in queue)
export const maxDuration = 120;

export async function POST(req: Request) {
  // Auth guard — reject unauthenticated callers before touching any paid API
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { type, model, ...params } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'image':
        result = await orchestrator.generateImage({ model, ...params });
        return NextResponse.json({ url: result });

      case 'video':
        result = await orchestrator.generateVideo({ model, ...params });
        // Result is now an object { requestId, status } or similar. Do not wrap in { url }.
        return NextResponse.json(result);

      case 'audio':
        const audioBuffer = await orchestrator.generateAudio({ model, ...params });
        // CassetteAI returns WAV; OpenAI/ElevenLabs/MusicGen return MP3
        const audioContentType = model === 'cassetteai' ? 'audio/wav' : 'audio/mpeg';
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': audioContentType,
            'Content-Length': audioBuffer.byteLength.toString(),
          },
        });

      case 'status':
        if (!params.requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
        const statusResult = await orchestrator.checkStatus(params.requestId, params.modelId); // Pass modelId if available
        return NextResponse.json(statusResult);

      default:
        return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Orchestrator API Error:", error);
    return NextResponse.json({ error: error.message || "Orchestration failed" }, { status: 500 });
  }
}
