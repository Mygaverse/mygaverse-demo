import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/scriptoplay/api-auth';

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { prompt, imageUrl, action, generationId } = await req.json(); // action: 'create' | 'status'
    const apiKey = process.env.LUMA_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing LUMA_API_KEY" }, { status: 401 });
    }

    // 1. Check Status
    if (action === 'status' && generationId) {
      const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'accept': 'application/json'
        },
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Luma Status Check Failed. Status:", response.status, "Body:", err);
        throw new Error(`Luma Status Check Failed: ${err}`);
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    // 2. Create Generation
    if (action === 'create') {
      const payload: any = {
        prompt: prompt,
        model: "ray-2",
      };

      // If we have an image, it's image-to-video (keyframes)
      if (imageUrl) {
        payload.keyframes = {
          frame0: {
            type: "image",
            url: imageUrl
          }
        };
      }

      const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Luma Creation Failed. Status:", response.status, "Body:", err);
        throw new Error(`Luma Creation Failed: ${err}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

  } catch (error: any) {
    console.error("Video API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
