import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/scriptoplay/api-auth';

// ElevenLabs voice ID → OpenAI fallback voice
// Used when ElevenLabs returns 402 (free plan blocks library voices).
// Mapped by gender/character tone so the fallback sounds reasonable.
const ELEVENLABS_TO_OPENAI_FALLBACK: Record<string, string> = {
  '21m00Tcm4TlvDq8ikWAM': 'nova',    // Rachel  — female, calm
  'AZnzlk1XvdvUeBnXmlld': 'nova',    // Domi    — female, strong
  'EXAVITQu4vr4xnSDxMaL': 'shimmer', // Bella   — female, soft
  'MF3mGyEYCl7XYWbV9V6O': 'shimmer', // Elli    — female, young
  'TxGEqnHWrfWFTfGW9XjX': 'echo',    // Josh    — male, warm
  'VR6AewLTigWg4xSOukaG': 'onyx',    // Arnold  — male, gruff
  'pNInz6obpgDQGcFmaJgB': 'onyx',    // Adam    — male, deep
  'ErXwobaYiN019PkySvjV': 'alloy',   // Antoni  — male, friendly
  'yoZ06aMxZJJ28mfd3POQ': 'echo',    // Sam     — male, raspy
  'flq6f7yk4E4fJM5XTYuZ': 'onyx',   // Michael — male, authoritative
};

async function generateWithOpenAI(text: string, voice: string, speed: number): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice,
      speed,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "OpenAI TTS Failed");
  }

  const audioBuffer = await response.arrayBuffer();
  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString(),
      'X-Audio-Provider': 'openai',
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { text, voice, speed, provider } = await req.json();
    const resolvedSpeed = speed || 1.0;

    // ---------------------------------------------------------
    // OPTION A: ELEVENLABS (with automatic OpenAI fallback)
    // ElevenLabs free plan blocks library voices (402).
    // On 402, we transparently fall back to the mapped OpenAI voice
    // so development continues without requiring a paid ElevenLabs plan.
    // ---------------------------------------------------------
    if (provider === 'elevenlabs' || (voice && voice.length > 10)) {
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
          const audioBuffer = await response.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'X-Audio-Provider': 'elevenlabs',
            },
          });
        }

        // 402 = free plan / library voice restriction → fall back to OpenAI silently
        if (response.status === 402) {
          const fallbackVoice = ELEVENLABS_TO_OPENAI_FALLBACK[voice] || 'alloy';
          console.warn(`[audio] ElevenLabs 402 for voice ${voice} — falling back to OpenAI '${fallbackVoice}'`);
          return generateWithOpenAI(text, fallbackVoice, resolvedSpeed);
        }

        // Any other ElevenLabs error — surface it
        const err = await response.json().catch(() => ({}));
        throw new Error(`ElevenLabs Failed: ${err.detail?.message || response.statusText}`);
      }

      // No ElevenLabs key at all — fall back to OpenAI mapped voice
      const fallbackVoice = ELEVENLABS_TO_OPENAI_FALLBACK[voice] || 'alloy';
      console.warn(`[audio] No ELEVENLABS_API_KEY — falling back to OpenAI '${fallbackVoice}'`);
      return generateWithOpenAI(text, fallbackVoice, resolvedSpeed);
    }

    // ---------------------------------------------------------
    // OPTION B: OPENAI (Default)
    // ---------------------------------------------------------
    return generateWithOpenAI(text, voice || 'alloy', resolvedSpeed);

  } catch (error: any) {
    console.error("Audio Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
