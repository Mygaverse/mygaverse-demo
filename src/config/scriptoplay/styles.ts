export const VISUAL_STYLES = [
  {
    id: 'pixar_3d',
    label: '3D Pixar Style',
    desc: 'Vibrant, high-quality 3D render with soft lighting and expressive characters.',
    prompt: '3D animated movie style, Pixar/Disney style, octane render, soft cinematic lighting, high fidelity, 8k, vibrant colors, cute and expressive features',
    narrativeInstructions: 'Focus on emotional beats, expressive character acting, and heartwarming moments. Use "squash and stretch" style descriptions for movement.',
    audioInstructions: 'Orchestral, whimsical, emotive. Use piano and strings for emotional moments, and bright brass for action. Think Randy Newman or Michael Giacchino.',
    preview: 'https://images.unsplash.com/photo-1633469924738-52101af51d87?w=300&q=80' // Placeholder
  },
  {
    id: 'bluey_vector',
    label: '2D Flat Vector (Preschool)',
    desc: 'Simple, colorful flat shapes with thick outlines. Like Bluey or Peppa Pig.',
    prompt: '2D flat vector art, thick bold outlines, pastel color palette, simple shapes, children\'s book illustration style, no shading, clean lines, minimalist background',
    narrativeInstructions: 'Keep actions simple and easy to follow. Focus on play, games, and clear physical movements. Avoid complex visual noise.',
    audioInstructions: 'Acoustic, playful, organic. Use marimbas, acoustic guitars, and melodicas. Simple melodies that kids can hum.',
    preview: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=300&q=80'
  },
  {
    id: 'ghibli_anime',
    label: 'Ghibli Anime',
    desc: 'Hand-painted backgrounds, whimsical atmosphere, traditional animation.',
    prompt: 'Studio Ghibli style, anime, hand-painted watercolor background, whimsical, lush greenery, soft natural lighting, detailed clouds, Hayao Miyazaki aesthetic',
    narrativeInstructions: 'Focus on atmospheric details, nature, and quiet moments ("Ma"). Describe the wind, light, and small magical details.',
    audioInstructions: 'Sweeping, melodic, piano-driven. Use orchestral swells for flying scenes and quiet, nostalgic piano for calmness. Joe Hisaishi style.',
    preview: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80'
  },
  {
    id: 'adventure_time',
    label: 'Modern Hand-Drawn',
    desc: 'Thin lines, flat colors, quirky proportions. Like Adventure Time or Gravity Falls.',
    prompt: 'Modern 2D cartoon style, thin ink lines, flat vibrant colors, quirky character design, calarts style, funny expressions, detailed environment but flat shading',
    narrativeInstructions: 'Focus on weird, surreal humor and rubber-hose physics. Characters can stretch or change shape for comedic effect.',
    audioInstructions: 'Chiptune mixed with Lo-Fi or Synth-Pop. Quirky sound effects, retro video game vibes, and upbeat electronic drums.',
    preview: 'https://images.unsplash.com/photo-1560167016-015b67812b1d?w=300&q=80'
  },
  {
    id: 'stop_motion',
    label: 'Claymation / Stop Motion',
    desc: 'Textured, physical look. Like Wallace & Gromit or Kubo.',
    prompt: 'Stop motion animation style, claymation material, plasticine texture, tilt-shift photography, shallow depth of field, handcrafted look, warm studio lighting',
    narrativeInstructions: 'Emphasize the texture and weight of objects. Describe physical transformations (clay morphing) and tactile interactions.',
    audioInstructions: 'Foley-heavy, intimate, slightly "clunky" percussion. Use pizzicato strings and woodwinds. Emphasize the sound of materials.',
    preview: 'https://images.unsplash.com/photo-1623936691764-77ae34479b18?w=300&q=80'
  }
];

export const AUDIENCE_TARGETS = [
  { id: 'preschool', label: 'Preschool (3-5)', desc: 'Simple plots, clear morals, gentle pacing.' },
  { id: 'kids', label: 'Kids (6-9)', desc: 'Action, humor, friendship, visual gags.' },
  { id: 'tween', label: 'Tween (10-13)', desc: 'Complex stories, emotional depth, cool factor.' },
  { id: 'teen_adult', label: 'Teen/Adult', desc: 'Edgy humor, satire, mature themes.' },
  { id: 'corporate', label: 'Corporate (B2B)', desc: 'Explainer videos, training, minimalist vectors.' }
];

export function getStyleConfig(styleId: string | null | undefined) {
  if (!styleId) return VISUAL_STYLES[0];

  // 1. Exact ID match
  const exactMatch = VISUAL_STYLES.find(s => s.id === styleId);
  if (exactMatch) return exactMatch;

  // 2. Legacy Label / Display Text match (catch old wizard data)
  const legacyMap: Record<string, string> = {
    '2D Vector': 'bluey_vector',
    '3D Stylized': 'pixar_3d',
    'Anime': 'ghibli_anime',
    'Hand-Drawn': 'adventure_time',
    'Mixed Media': 'stop_motion'
  };

  const mappedId = legacyMap[styleId];
  if (mappedId) {
    const mappedMatch = VISUAL_STYLES.find(s => s.id === mappedId);
    if (mappedMatch) return mappedMatch;
  }

  // Fallback to Pixard 3D if truly not found
  return VISUAL_STYLES[0];
}
