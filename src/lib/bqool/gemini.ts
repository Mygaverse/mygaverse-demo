
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Gemini API Key is missing! Make sure NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local");
}

// Initialize the GoogleGenAI client with the API key
const genAI = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

export default genAI;
