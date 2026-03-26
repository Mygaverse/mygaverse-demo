import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    // 1. Verify Key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error("Server Error: Missing GOOGLE_GEMINI_API_KEY");
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const { prompt } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

    // 2. Use 'gemini-pro' (The most stable model for v1beta)
    // If this fails later, we can try 'gemini-1.0-pro'
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Generate
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error: any) {
    console.error("----------- GEMINI API ERROR -----------");
    console.error(error);
    console.error("----------------------------------------");

    // Check for Rate Limit (Google uses 429 or specific message)
    if (error.message?.includes('429') || error.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({
      error: error.message || "AI Generation Failed"
    }, { status: 500 });
  }
}