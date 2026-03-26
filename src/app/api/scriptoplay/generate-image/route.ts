import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/scriptoplay/api-auth';

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { prompt } = await req.json();

    // 1. Check for API Key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in server environment." },
        { status: 401 }
      );
    }

    // 2. Call OpenAI DALL-E 3 (With Retry)
    const MAX_RETRIES = 3;
    let attempt = 0;

    // Truncate Prompt to avoid length issues (max ~4000 chars usually, but 2000 is safer)
    const safePrompt = prompt.substring(0, 2000);

    while (attempt < MAX_RETRIES) {
      try {
        attempt++;
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: safePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || "OpenAI Generation Failed";

          // If it's a server error (5xx), we retry. 4xx is user error (billing, prompt), usually fatal.
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            console.warn(`DALL-E 3 attempt ${attempt} failed: ${errorMessage}. Retrying...`);
            await new Promise(res => setTimeout(res, 1000 * attempt)); // Exponential-ish backoff
            continue;
          }

          console.error("OpenAI API Error:", errorData);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return NextResponse.json({ url: data.data[0].url });

      } catch (apiError: any) {
        console.error(`DALL-E 3 Request Failed (Attempt ${attempt}):`, apiError);
        // Only retry on network errors or if we decided it was retriable above
        if (attempt < MAX_RETRIES) {
          await new Promise(res => setTimeout(res, 1000 * attempt));
          continue;
        }
        throw new Error(apiError.message || "Failed to contact OpenAI");
      }
    }

  } catch (error: any) {
    console.error("Image Generation Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
