import { getAudienceGuidelines } from '@/utils/scriptoplay/cartoonTemplates';

export const aiService = {
  async generate(prompt: string, context?: string) {
    try {
      // Construct a better prompt with context if provided
      const fullPrompt = context
        ? `Context: ${context}\n\nTask: ${prompt}`
        : prompt;

      const response = await fetch('/api/scriptoplay/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("AI Service Error:", response.status, errorData);

        // Handle Rate Limits (429)
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }

        throw new Error(errorData.error || `AI Generation Failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error: any) {
      console.error("AI Generate Error:", error);
      if (error.message === "RATE_LIMIT") throw error; // Propagate for retry
      throw error; // Rethrow to allow caller to handle or retry
    }
  },

  // Helper for structured JSON responses
  async generateStructured(prompt: string, retries = 5) { // Increased retries
    try {
      const jsonPrompt = `${prompt} \n\nCRITICAL: Return ONLY valid JSON. No markdown.`;

      let text = "";
      let attempt = 0;

      while (attempt < retries) {
        try {
          text = await this.generate(jsonPrompt);
          break; // Success
        } catch (e: any) {
          if (e.message === "RATE_LIMIT") {
            attempt++;
            // Exponential Backoff: 1s, 2s, 4s, 8s, 16s...
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.warn(`Rate limit hit (Attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));

            if (attempt >= retries) throw new Error("AI Service is busy (Rate Limit Exceeded). Please wait a moment and try again.");
          } else {
            throw e; // Other errors fatal
          }
        }
      }

      // Extract JSON block (handles conversational text before/after)
      const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error("No JSON object or array found in AI response");
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("AI JSON Parse/Gen Error:", error);
      throw new Error("Failed to generate structured data");
    }
  },

  async generateVisualDescriptions(beats: any[], styleConfig?: { prompt: string; label: string }, genre?: string, vibe?: string, audience?: string) {
    try {
      const audienceGuidelines = getAudienceGuidelines(audience);
      const stylePrompt = styleConfig
        ? `VISUAL STYLE: ${styleConfig.label} (${styleConfig.prompt}). ALL ASSETS MUST MATCH THIS STYLE.`
        : '';

      const prompt = `
        Act as a Cartoon Character Designer and Environment Artist.
        ${stylePrompt}
        GENRE: ${genre || 'General'}
        ATMOSPHERE: ${vibe || 'Default'}
        TARGET AUDIENCE: ${audience || 'General'}
        SAFETY/TONE: ${audienceGuidelines}
        
        Analyze the following Beat Sheet for a cartoon:
        ${JSON.stringify(beats)}

        Based on the actions and events, generate a list of CHARACTER and ENVIRONMENT assets needed.
        
        For Characters:
        - Include Name, Visual Description (appearance, style), Role (Protagonist, Antagonist, Supporting), Tags (array of 1-3 keywords).
        - **consistencyLock**: A 1-sentence "Visual Manifesto" describing immutable traits (Species, Color Hex Codes, Key Accessories). Example: "Orange camel, #FF8C00 fur, blue backpack, flat 2D style."
        
        - **prompt** (PRIMARY - Used for Scene Generation via char_ref):
          Generate a SINGLE, CLEAN CHARACTER PORTRAIT in 3/4 view.
          Requirements: centered character, neutral/composed pose, clear face and outfit, white or solid-color background, concept art style, clean linework.
          Format: "[character description], 3/4 view portrait, centered composition, clean white background, concept art, [style tags]"
          This image will be used directly as the char_ref anchor for all scene shots — make it clean and unambiguous.
        
        - **prompt_lora_sheet** (SECONDARY - Used for LoRA Training later):
          Generate a MULTI-POSE CHARACTER SHEET showing: Front view, Back view, 3/4 Left, 3/4 Right, Close-up face, and 2-3 key expressions.
          Requirements: all poses on white background, clean lines, labeled views, concept art, character sheet layout.
          Format: "[character description], character reference sheet, turnaround, multiple angles, front back side view, expression sheet, white background, concept art, [style tags]"
        
        For Environments:
        - Include Name, Visual Description (mood, lighting, key elements), Tags (array of 1-3 keywords), and a precise Image Prompt (cinematic, wide establishing shot).
        - **consistencyLock**: Key architectural or color elements that must remain constant.
        - No prompt_lora_sheet needed for environments.

        Output JSON array of objects:
        [
          { "type": "Character", "name": "...", "description": "...", "role": "...", "tags": ["..."], "prompt": "...", "prompt_lora_sheet": "...", "consistencyLock": "..." },
          { "type": "Environment", "name": "...", "description": "...", "tags": ["..."], "prompt": "...", "consistencyLock": "..." }
        ]
      `;
      return await this.generateStructured(prompt);
    } catch (error) {
      console.error("Visual Gen Error:", error);
      return [];
    }
  },

  /**
   * Intelligently assigns valid OpenAI voice IDs to characters
   */
  async castVoices(characters: any[], availableVoices: any[], audience?: string) {
    try {
      const audienceGuidelines = getAudienceGuidelines(audience);

      const prompt = `
         Act as a Casting Director.
         Assign the best Voice Actor from the AVAILABLE LIST to each Character.
         
         Target Audience: ${audience}.
         Guidelines: ${audienceGuidelines}

         Characters:
         ${JSON.stringify(characters.map(c => ({ id: c.id, name: c.name, desc: c.desc, role: c.role })))}
 
         AVAILABLE VOICES:
         ${JSON.stringify(availableVoices.map(v => ({ id: v.id, name: v.name, gender: v.gender, tags: v.tags })))}
 
         Rules:
         1. Choose the voice that best matches the character's gender, age vibe, and personality.
         2. Explain your reasoning briefly.
         3. CRITICAL: The "characterId" field in your output MUST be the EXACT "id" value from the Characters list above. Copy it verbatim — do NOT change it, simplify it, or use a counter like "1" or "2".
         4. The "voiceId" field MUST be the EXACT "id" value from the AVAILABLE VOICES list. Copy verbatim.
 
         Output JSON array:
         [
           { "characterId": "<copy exact character id>", "voiceId": "<copy exact voice id>", "reason": "..." }
         ]
       `;

      const result = await this.generateStructured(prompt);

      if (Array.isArray(result)) return result;
      if (result && typeof result === 'object') {
        // Single object fallback
        if (result.characterId && result.voiceId) return [result];
        // Wrapped object fallback { casting: [...] }
        const key = Object.keys(result).find(k => Array.isArray((result as any)[k]));
        if (key) return (result as any)[key];
      }
      return [];
    } catch (e) {
      console.error("Casting Error:", e);
      return [];
    }
  },

  /**
   * Generates a Soundtrack Plan based on the Beat Sheet
   */
  /**
   * Generates a Soundtrack Plan based on the Beat Sheet and Format
   */
  async composeSoundtrack(beats: any[], format: 'short' | 'long', audience?: string, styleInstructions?: string, genre?: string, vibe?: string, theme?: string, sfxStyle?: string) {
    try {
      const audienceGuidelines = getAudienceGuidelines(audience);
      const isShort = format === 'short';

      const prompt = `
        Act as a Film/Cartoon Composer.
        Analyze this Beat Sheet and compose a ${isShort ? 'SINGLE cohesive track' : 'multi-track musical score plan (3-5 tracks)'}.
        
        FORMAT: ${isShort ? 'Short (<30s). ONE TRACK ONLY.' : 'Long (>30s). Multiple tracks for different story segments.'}
        Target Audience: ${audience}.
        Audience Vibe: ${audienceGuidelines}
        GENRE: ${genre || 'General'}
        VIBE: ${vibe || 'Appropriate'}
        THEME: ${theme || 'None'}
        SFX/AUDIO STYLE: ${sfxStyle || 'Standard'}
        
        MUSICAL STYLE: ${styleInstructions || 'Cinematic, appropriate for the genre.'}

        Beat Sheet:
        ${JSON.stringify(beats)}

        INSTRUCTIONS:
        ${isShort
          ? '- Create exactly 1 track that captures the overall essence of the story.'
          : '- create 3-5 tracks that correspond to the beginning, middle, and end of the story.'}
        
        For each track, provide:
        - "title": A catchy track title.
        - "vibe": 2-3 adjectives (e.g., Whimsical, Tense).
        - "description": A musical description suitable for a Music AI prompt (instruments, tempo, mood).
        
        Ensure the music reflects the "${vibe}" atmosphere and underscores the theme of "${theme}".

        CRITICAL FORMAT RULE: Output a flat JSON ARRAY only. Do NOT wrap in any object key like { "tracks": [...] }.
        The response must start with [ and end with ].
      `;

      const raw = await this.generateStructured(prompt);

      // Robust unwrapping: AI sometimes wraps in { tracks: [...] } or { soundtrack: [...] }
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') {
        // Did it return a single track object?
        if (raw.title && raw.description) return [raw];
        const key = Object.keys(raw).find(k => Array.isArray((raw as any)[k]));
        if (key) return (raw as any)[key];
      }
      return [];
    } catch (e) {
      console.error("Composing Error:", e);
      return [];
    }
  },

};