// Voice catalogue
// OpenAI voices work on any plan. ElevenLabs library voices require a paid ElevenLabs plan —
// they will auto-fallback to the OpenAI equivalent in /api/generate-audio if the free plan 402s.
const VOICES = [
  // --- OpenAI TTS (free for development, no plan restriction) ---
  { id: 'alloy',   name: 'Alloy',   gender: 'Neutral', tags: ['Versatile', 'Clear'],                    provider: 'openai' },
  { id: 'echo',    name: 'Echo',    gender: 'Male',    tags: ['Warm', 'Friendly'],                       provider: 'openai' },
  { id: 'fable',   name: 'Fable',   gender: 'Male',    tags: ['British', 'Expressive', 'Narrator'],      provider: 'openai' },
  { id: 'onyx',    name: 'Onyx',    gender: 'Male',    tags: ['Deep', 'Authoritative', 'Gravelly'],      provider: 'openai' },
  { id: 'nova',    name: 'Nova',    gender: 'Female',  tags: ['Energetic', 'Professional'],              provider: 'openai' },
  { id: 'shimmer', name: 'Shimmer', gender: 'Female',  tags: ['Soft', 'Clear', 'Friendly'],              provider: 'openai' },

  // --- ElevenLabs (Premium — requires paid ElevenLabs plan; falls back to OpenAI on free) ---
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',  gender: 'Female', tags: ['American', 'Calm', 'Narration'],         provider: 'elevenlabs', requiresPaid: true },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',    gender: 'Female', tags: ['American', 'Strong', 'Confident'],       provider: 'elevenlabs', requiresPaid: true },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',   gender: 'Female', tags: ['American', 'Soft', 'Young'],             provider: 'elevenlabs', requiresPaid: true },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',    gender: 'Female', tags: ['Young', 'Emotional', 'Expressive'],      provider: 'elevenlabs', requiresPaid: true },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',    gender: 'Male',   tags: ['American', 'Deep', 'Narration'],         provider: 'elevenlabs', requiresPaid: true },
  { id: 'VR6AewLTigWg4xSOukaG', name: 'Arnold',  gender: 'Male',   tags: ['American', 'Gruff', 'Narrative'],        provider: 'elevenlabs', requiresPaid: true },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    gender: 'Male',   tags: ['American', 'Deep', 'Mature'],            provider: 'elevenlabs', requiresPaid: true },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni',  gender: 'Male',   tags: ['American', 'Well-rounded', 'Friendly'],  provider: 'elevenlabs', requiresPaid: true },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',     gender: 'Male',   tags: ['American', 'Raspy', 'Trustworthy'],      provider: 'elevenlabs', requiresPaid: true },
  { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Michael', gender: 'Male',   tags: ['Old', 'Authoritative', 'Classic'],       provider: 'elevenlabs', requiresPaid: true },
];

export const audioService = {
  async getVoices() {
    return VOICES;
  },

  async previewVoice(voiceId: string) {
    try {
      // 1. Pick a sample text based on voice? Or just generic.
      const sampleText = "Hello! I am ready to bring your character to life.";

      const voiceObj = VOICES.find(v => v.id === voiceId);
      const provider = voiceObj?.provider || 'openai';

      const response = await fetch('/api/scriptoplay/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleText, voice: voiceId, provider }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Audio generation failed: ${response.statusText}`);
      }

      // 2. Play the blob directly
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      // Return the audio duration or promise handling
      return new Promise((resolve) => {
        audio.onended = () => {
          resolve(true);
          URL.revokeObjectURL(url); // Cleanup
        };
      });

    } catch (e) {
      console.error("Preview failed:", e);
      return false;
    }
  },

  async generateSpeech(text: string, voiceId: string, options?: { speed?: number, stability?: number }): Promise<string | null> {
    try {
      const voiceObj = VOICES.find(v => v.id === voiceId);
      const provider = voiceObj?.provider || 'openai';

      const response = await fetch('/api/scriptoplay/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          model: provider,
          text,
          voice: voiceId,
          ...options
        }),
      });

      if (!response.ok) {
        let errorMessage = `Audio generation failed: ${response.status} ${response.statusText}`;
        try {
          // Attempt to parse JSON error, but don't fail if it's plain text or HTML
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || JSON.stringify(errorData.error);
          }
        } catch (parseError) {
          // If response isn't JSON, we fall back to the statusText message above
          console.warn("Audio Service: Non-JSON error response received");
        }

        console.error("Audio Service Error:", errorMessage);
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Generate Speech failed:", e);
      return null;
    }
  },

  async generateMusic(prompt: string, duration?: number, model: 'suno' | 'musicgen' | 'cassetteai' = 'cassetteai'): Promise<string | null> {
    try {
      const response = await fetch('/api/scriptoplay/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          model, // 'suno' (AceData) | 'musicgen' (Replicate 30s) | 'cassetteai' (Fal, fast, variable duration)
          prompt,
          duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Music generation failed with status: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e: any) {
      console.error("Generate Music failed:", e);
      return null;
    }
  }
};
