'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/scriptoplay/ui/Icon';
import Button from '@/components/scriptoplay/ui/Button';
import Badge from '@/components/scriptoplay/ui/Badge';
import { ICONS } from '@/config/scriptoplay/icons';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import { projectService } from '@/services/scriptoplay/projectService';

import { aiService } from '@/services/scriptoplay/aiService';
import { getAudienceGuidelines } from '@/utils/scriptoplay/cartoonTemplates';

// --- Types ---
interface BlendedIdea {
  title: string;
  desc: string;
}

interface ScriptBlenderProps {
  mode?: 'default' | 'cartoon';
  initialConfig?: any; // For Cartoon Mode constraints
  onLoglineSelect?: (logline: string) => void; // For consuming result inline
}

// --- Configuration Data ---
const DEFAULT_GENRES = [
  { id: 'sci-fi', label: 'Sci-Fi', color: 'text-blue-400 border-blue-500/50' },
  { id: 'horror', label: 'Horror', color: 'text-red-400 border-red-500/50' },
  { id: 'comedy', label: 'Comedy', color: 'text-yellow-400 border-yellow-500/50' },
  { id: 'drama', label: 'Drama', color: 'text-purple-400 border-purple-500/50' },
];

const DEFAULT_INGREDIENTS = {
  Characters: ['Underdog', 'talking Animal', 'Genius Kid', 'New Kid', 'Sidekick', 'Bully'],
  Settings: ['High School', 'Small Town', 'Secret Base', 'Magical Land', 'Big City', 'Summer Camp'],
  Time: ['Summer Vacation', 'First Day of School', 'The Future', 'Medieval Times', 'Saturday Morning'],
  Culture: ['Video Games', 'Super Powers', 'Social Media', 'Urban Legends', 'Sports', 'Music']
};

export default function ScriptBlender({ mode = 'default', initialConfig, onLoglineSelect }: ScriptBlenderProps) {
  const isCartoonMode = mode === 'cartoon';

  // Compute initial state based on Cartoon Config if present
  const [genre, setGenre] = useState(isCartoonMode ? initialConfig?.genre || 'Comedy' : 'sci-fi');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isBlending, setIsBlending] = useState(false);
  //state for the LIST of results
  const [results, setResults] = useState<BlendedIdea[] | null>(null);

  // Router & Auth
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // State for ingredients (Dynamic in Cartoon Mode)
  const [ingredients, setIngredients] = useState<Record<string, string[]>>(DEFAULT_INGREDIENTS);

  // --- Cartoon Ingredients Logic ---
  useEffect(() => {
    if (isCartoonMode && initialConfig) {
      const g = initialConfig.genre || 'Comedy';
      const a = initialConfig.audience || 'Tween';

      // 1. Generic Cartoon Defaults (Fallback)
      let newIngredients: Record<string, string[]> = {
        'Characters': ['Talking Pet', 'Genius Kid', 'Robot Buddy', 'Magical Princess', 'Super Hero', 'Space Alien', 'Ninja'],
        'Settings': ['Treehouse', 'High School', 'Secret Lab', 'Enchanted Forest', 'Moon Base', 'Summer Camp', 'Mall'],
        'Time': ['Summer Vacation', 'The Future', 'Dino Age', 'After School', 'Saturday Morning', 'Medieval'],
        'Culture': ['Magic & Spells', 'Super Powers', 'Video Games', 'Pranks & Gags', 'Inventions', 'Pop Stars']
      };

      // 2. Genre Specific Overrides
      if (g === 'Sci-Fi') {
        newIngredients.Settings = ['Space Station', 'Alien Planet', 'Future City', 'Mecha Hangar', 'Spaceship', 'Cyber Slums'];
        newIngredients.Characters = ['Robot', 'Alien', 'Space Marine', 'Bounty Hunter', 'Cyborg', 'Hacker Kid'];
        newIngredients.Culture = ['Lasers', 'Time Travel', 'Viruses', 'Clones', 'Holograms', 'AI Uprising'];
        newIngredients.Time = ['Year 3000', 'Post-Apocalypse', 'The Singularity', 'Light Speed Era'];
      }
      else if (g === 'Fantasy') {
        newIngredients.Settings = ['Castle', 'Dungeon', 'Wizard Tower', 'Village', 'Cloud Kingdom', 'Forbidden Woods'];
        newIngredients.Characters = ['Knight', 'Wizard', 'Dragon', 'Elf', 'Fairy', 'Chosen One'];
        newIngredients.Culture = ['Potions', 'Curses', 'Prophecies', 'Myths', 'Quests', 'Ancient Relics'];
        newIngredients.Time = ['Age of Magic', 'The Dark Ages', 'Before Time', 'Eternal Winter'];
      }
      else if (g === 'Slapstick') {
        newIngredients.Characters = ['Clumsy Fool', 'Angry Neighbor', 'Mischievous Cat', 'Chase Target', 'Hungry Preditor', 'Simplistic Duo'];
        newIngredients.Settings = ['Suburbia', 'The Desert', 'Construction Site', 'Restaurant', 'The Zoo', 'Bowling Alley'];
        newIngredients.Culture = ['Pies', 'Anvils', 'Explosions', 'Chases', 'Disguises', 'Failures'];
        newIngredients.Time = ['Lunch Time', 'Rush Hour', 'The Weekend', 'Big Date Night'];
      }
      else if (g === 'Action') {
        newIngredients.Characters = ['Secret Agent', 'Martial Artist', 'Super Soldier', 'Vigilante', 'Team Leader', 'Rookie'];
        newIngredients.Settings = ['Volcano Lair', 'Rooftops', 'High Speed Train', 'Tournament Arena', 'Jungle Temple'];
        newIngredients.Culture = ['Gadgets', 'Martial Arts', 'Explosions', 'Vehicle Stunts', 'Nemesis', 'Rescue Mission'];
        newIngredients.Time = ['Ticking Clock', 'Doomsday', 'The Final Countdown', 'Zero Hour'];
      }
      else if (g === 'Slice of Life') {
        newIngredients.Characters = ['High Schooler', 'Awkward Teen', 'Overbearing Mom', 'Best Friend', 'Crush', 'Rival'];
        newIngredients.Settings = ['Classroom', 'Cafeteria', 'Bedroom', 'Coffee Shop', 'The Park', 'Bus Stop'];
        newIngredients.Culture = ['Rumors', 'Homework', 'Concerts', 'Viral Trends', 'Part-time Jobs', 'Dating'];
        newIngredients.Time = ['Spring Break', 'Exam Week', 'Prom Night', 'Graduation', 'Summer Haze'];
      }

      // 3. Audience Adjustments (Overrides or Additions)
      const aLower = (a || '').toLowerCase();
      if (aLower.includes('preschool') || aLower.includes('2-5')) {
        newIngredients.Characters = ['Teddy Bear', 'Train', 'Duckling', 'Mommy & Daddy', 'Teacher', 'Friendly Monster'];
        newIngredients.Settings = ['Playground', 'Bedroom', 'Garden', 'Pre-School', 'Bathtub', 'Toy Box'];
        newIngredients.Culture = ['Sharing', 'Colors', 'Numbers', 'Hugs', 'Songs', 'Imagination'];
        newIngredients.Time = ['Bedtime', 'Nap Time', 'Play Time', 'Morning', 'Spring'];
      }
      else if (aLower.includes('adult') || aLower.includes('teen') || aLower.includes('18+')) {
        newIngredients.Characters = ['Cynical Roommate', 'Burnout', 'Talking Animal (Rude)', 'Office Worker', 'Ex-Hero'];
        newIngredients.Settings = ['Dive Bar', 'Office Cubicle', 'Cramped Apartment', 'Traffic Jam', 'Therapist Office'];
        newIngredients.Culture = ['Taxes', 'Dating Apps', 'Coffee Addiction', 'Existential Dread', 'Rent', 'Politics'];
      }

      setIngredients(newIngredients);
      setGenre(g); // Sync genre selection
    }
  }, [mode, initialConfig]);


  // --- Handlers for Ingredients ---
  const handleItemClick = (category: string, item: string) => {
    // Check if item is already selected -> Toggle off
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
      return;
    }

    // Otherwise, check if we already have an item from this category
    const categoryItems = ingredients[category] || [];
    const currentSelectionInCategory = selectedItems.find(i => categoryItems.includes(i));

    let newItems = [...selectedItems];

    // If we have an item from this category, remove it (Radio behavior)
    if (currentSelectionInCategory) {
      newItems = newItems.filter(i => i !== currentSelectionInCategory);
    }

    // Add new item (Check limit of 5 total just in case)
    if (newItems.length < 5 || currentSelectionInCategory) {
      newItems.push(item);
      setSelectedItems(newItems);
    }
  };

  // Re-added for Custom Input (No category restriction/radio behavior needed usually, or treat as wild)
  const addItem = (item: string) => {
    if (selectedItems.length >= 5) return;
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const removeItem = (item: string) => {
    setSelectedItems(selectedItems.filter((i) => i !== item));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput && selectedItems.length < 5) {
      addItem(customInput);
      setCustomInput('');
    }
  };

  // --- AI GENERATION ---
  const handleBlend = async () => {
    setLoading(true);
    setResults(null); // Clear previous results
    setIsBlending(true);

    try {
      // Construct the prompt based on user selection
      let prompt = '';
      const isMicroShort = isCartoonMode && (initialConfig?.length === '15s' || initialConfig?.length === 'Micro-Short (15-30s)');

      if (isCartoonMode) {
        const audienceGuidelines = getAudienceGuidelines(initialConfig?.audience);

        // 15-second shorts require a specific logline format to be physically produceable by AI video models.
        // The format enforces: one location, one-two characters, one physical action arc, one resolution.
        const microShortFormatBlock = (isMicroShort) ? `
           ⚠️ 15-SECOND SHORT FORMAT — THIS IS MANDATORY:
           The logline MUST follow this exact pattern:
           "A [CHARACTER] in [ONE LOCATION] [does/encounters something], which causes [PHYSICAL REACTION], resulting in [EMOTIONAL OR PHYSICAL RESOLUTION]."

           HARD RULES for 15s:
           - ONE primary location only. The character cannot travel to multiple places.
           - Maximum TWO characters (protagonist + one other).
           - ONE sustained physical action arc from start to end.
           - The resolution must be physically reachable from the starting situation.
           - No scene cuts requiring a full environment change.
           - Think: Tom & Jerry gag, Pixar Lamp short, TikTok animation loop.
           - The whole story must be imaginable as one continuous 15-second shot.
           - STRICT MAXIMUM: 30 WORDS PER LOGLINE. Count every single word. If your draft exceeds 30 words, cut it. This is a hard limit enforced by the system.
        ` : '';

        prompt = `
           Act as a Cartoon Creator for a ${initialConfig?.audience || 'General'} audience show.
           Format: ${initialConfig?.length || '11m'}.
           Style: ${initialConfig?.visualStyle || '2D'}.
           Genre: ${genre}
           Vibe (Atmosphere): ${initialConfig?.vibe || 'Fun'}.
           Constraint Theme: ${initialConfig?.theme || 'Any'}.

           AUDIENCE GUIDELINES: ${audienceGuidelines}
           ${microShortFormatBlock}

           Generate 3 distinct, high-concept loglines based on these constraints:
           - Genre: ${genre}
           - Key Elements: ${selectedItems.join(', ') || 'Surprise Me'}

           The loglines must be punchy, commercial, and fit the ${initialConfig?.audience} demographic perfectly.
           ${isMicroShort ? 'Each logline MUST strictly follow the 15-SECOND SHORT FORMAT above.' : ''}

           CRITICAL: Return ONLY a valid JSON array.
           Format: [ { "title": "Title", "desc": "Logline" } ]
        `;
      } else {
        prompt = `
           Act as a professional screenwriter. 
           Generate 3 distinct, compelling movie concepts based on these parameters:
           - Genre: ${genre || 'Sci-Fi'}
           - Keywords: ${selectedItems.join(', ') || 'Space, Mystery'}

           CRITICAL: Return ONLY a valid JSON array.
           Format: [ { "title": "Title", "desc": "Logline" } ]
         `;
      }

      // 2. Call AI parsing through structured generator
      const parsedResults = await aiService.generateStructured(prompt);

      if (Array.isArray(parsedResults)) {
        // For 15s micro-shorts: hard-enforce the 45-word cap on each logline.
        // AI frequently ignores soft word-count instructions; this ensures the
        // LoglinePhase Proceed button (maxWords=50) is never blocked by a BlenderResult.
        const finalResults = isMicroShort
          ? parsedResults.map((r: any) => {
              const words = (r.desc || '').trim().split(/\s+/);
              return words.length > 45
                ? { ...r, desc: words.slice(0, 45).join(' ') }
                : r;
            })
          : parsedResults;
        setResults(finalResults);
      } else {
        throw new Error("AI did not return an array");
      }

    } catch (err) {
      console.error("Blend Error:", err);
      // Fallback Mock for Demo if API fails
      setResults([
        { title: `${genre} Adventure`, desc: `A generated story about ${selectedItems[0] || 'something'} in a ${genre} world.` },
        { title: "The Mix Up", desc: `What happens when ${selectedItems[1] || 'chaos'} meets ${selectedItems[0] || 'order'}?` },
        { title: "Cartoon caper", desc: "A wild ride through the imagination." }
      ]);
    } finally {
      setLoading(false);
      setIsBlending(false);
    }
  };

  // --- SELECTION HANDLER ---
  const handleSelectResult = async (ideaTitle: string, ideaLogline: string) => {
    if (onLoglineSelect) {
      // Inline mode (Cartoon Editor)
      onLoglineSelect(ideaLogline);
      // Optional: Scroll down or show success?
      // We assume the parent handles view switching
    } else {
      // Default: Create new project (Dashboard)
      handleCreateProject(ideaTitle, ideaLogline);
    }
  };


  // --- REAL FIRESTORE CREATION (Legacy/Default Mode) ---
  const handleCreateProject = async (ideaTitle: string, ideaLogline: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const projectId = await projectService.createProject(user.uid, ideaTitle, {
        logline: ideaLogline,
        type: isCartoonMode ? 'cartoon' : 'film', // Explicitly set type based on mode
        modules: {
          themes: [{ id: 't1', name: 'Generated Theme', tag: 'Genre', color: 'from-purple-600 to-blue-600' }],
          // Save Genre explicitly
          genre: genre,
          // Save Cartoon Config to Modules (Standardized Location)
          ...(isCartoonMode && initialConfig ? {
            style: initialConfig.visualStyle,
            audience: initialConfig.audience,
            vibe: initialConfig.vibe,
            audioConfig: initialConfig.audio,
            length: initialConfig.length
          } : {})
        },
        // Also pass detailed config to root data for easy access by service logic if needed
        ...(isCartoonMode && initialConfig ? {
          style: initialConfig.visualStyle,
          audience: initialConfig.audience,
          vibe: initialConfig.vibe,
          audioConfig: initialConfig.audio,
          length: initialConfig.length
        } : {})
      });
      router.push(`/scriptoplay/dashboard/workspace?id=${projectId}&source=blender`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row w-full bg-[#0f0f0f] text-white overflow-hidden rounded-2xl border border-[#262626] ${isCartoonMode ? 'h-[500px]' : 'h-full'}`}>

      {/* LEFT PANE: The Pantry (Inputs) */}
      <div className="w-full lg:w-1/2 p-6 lg:p-8 overflow-y-auto border-r border-[#262626] overflow-hidden scrollbar-thin scrollbar-thumb-zinc-800">

        {/* 1. Genre Selector (Read-Only/Display in Cartoon Mode if locked, or selectable) */}
        {!isCartoonMode && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">1. Base Liquid (Genre)</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {DEFAULT_GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${genre === g.id
                    ? `bg-[#1a1a1a] ${g.color} shadow-[0_0_15px_rgba(0,0,0,0.5)]`
                    : 'border-[#262626] text-gray-500 hover:border-gray-500'
                    }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isCartoonMode && initialConfig && (
          <div className="mb-6 flex gap-4 text-sm text-gray-400">
            <span className="px-3 py-1 bg-[#1a1a1a] rounded-lg border border-[#333]">Target: <strong className="text-white">{initialConfig.audience}</strong></span>
            <span className="px-3 py-1 bg-[#1a1a1a] rounded-lg border border-[#333]">Genre: <strong className="text-white">{genre}</strong></span>
            <span className="px-3 py-1 bg-[#1a1a1a] rounded-lg border border-[#333]">Theme: <strong className="text-white">{initialConfig.theme}</strong></span>
          </div>
        )}

        {/* 2. Ingredients */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {isCartoonMode ? "Select Keywords (4 + 1 Custom)" : "2. Add Ingredients (Max 5)"}
            </h3>
            <span className="text-xs text-gray-500">{selectedItems.length}/5 Selected</span>
          </div>

          <div className="space-y-6">
            {Object.entries(ingredients).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs text-gray-500 mb-3 font-medium">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleItemClick(category, item)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${selectedItems.includes(item)
                        ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-md shadow-purple-900/50'
                        : 'bg-[#141414] border-[#262626] text-gray-300 hover:border-gray-500 hover:text-white'
                        }`}
                    >
                      {item} {selectedItems.includes(item) && <Icon icon={ICONS.check} size={12} className="inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Custom Input */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{isCartoonMode ? "Add a Custom Twist" : "3. Secret Spice"}</h3>
          <form onSubmit={handleAddCustom} className="relative">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type your own keyword..."
              className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors pr-12 text-white"
            />
            <button
              type="submit"
              disabled={!customInput || selectedItems.length >= 5}
              className="absolute right-2 top-1.5 bg-[#262626] hover:bg-purple-600 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#262626]"
            >
              <Icon icon={ICONS.plus} size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANE: The Blender (Visuals) */}
      <div className="w-full lg:w-1/2 p-8 bg-gradient-to-br from-[#0a0a0a] to-[#111] flex flex-col items-center justify-center relative">

        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-radial-at-c from-purple-900/10 to-transparent pointer-events-none" />

        {/* THE BLENDER JAR */}
        <div className="relative z-10 w-64 h-[80%] flex flex-col items-center justify-center">

          {/* Visual Container */}
          <div className={`w-64 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-end shadow-2xl transition-all ${isBlending ? 'h-64' : 'h-64'}`}>

            {/* Blender Blade (Visual) */}
            <motion.div
              animate={isBlending ? { rotate: 360 } : { rotate: 0 }}
              transition={isBlending ? { repeat: Infinity, duration: 0.1, ease: "linear" } : {}}
              className="w-12 h-2 bg-gray-400 rounded-full absolute bottom-6"
            />
            <motion.div
              animate={isBlending ? { rotate: -360 } : { rotate: 45 }}
              transition={isBlending ? { repeat: Infinity, duration: 0.1, ease: "linear" } : {}}
              className="w-12 h-2 bg-gray-400 rounded-full absolute bottom-6"
            />

            {/* The Ingredients */}
            <div className="absolute inset-0 p-8 flex flex-wrap content-end justify-center gap-2 pb-16">
              <AnimatePresence>
                {!isBlending && selectedItems.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ y: -400, opacity: 0, rotate: Math.random() * 45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.4, delay: i * 0.1 }}
                    className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2"
                  >
                    {item}
                    <button onClick={() => removeItem(item)} className="hover:text-black">×</button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Blend Button */}
          <div className="mt-6">
            <button
              onClick={handleBlend}
              disabled={isBlending || selectedItems.length === 0}
              className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer ${isBlending
                ? 'bg-red-500 border-red-700 animate-pulse'
                : selectedItems.length > 0
                  ? 'bg-green-500 border-green-700 hover:bg-green-400 hover:scale-105'
                  : 'bg-gray-700 border-gray-600 cursor-not-allowed'
                }`}
            >
              <Icon icon={isBlending ? ICONS.refresh : ICONS.sparkles} size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Results Overlay */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-md z-20 p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Fresh Ideas</h2>
                <Button variant="ghost" onClick={handleBlend} size="sm">
                  <Icon icon={ICONS.refresh} className="mr-2" /> Blend Again
                </Button>
              </div>

              <div className="grid gap-3 overflow-y-auto">
                {results.map((idea, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-[#141414] border border-[#262626] rounded-xl hover:border-purple-500/50 group transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-md font-bold text-white group-hover:text-purple-400 transition-colors">{idea.title}</h3>
                      {isCartoonMode ? (
                        <Button
                          size="sm"
                          className="transition-opacity cursor-pointer text-xs px-3"
                          onClick={() => handleSelectResult(idea.title, idea.desc)}
                          isLoading={loading}
                        >
                          Work as Logline
                        </Button>
                      ) : (
                        <Badge variant="default">Match 95%</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{idea.desc}</p>

                    {!isCartoonMode && (
                      <div className="mt-4 transition-opacity flex justify-end">
                        <Button
                          size="sm"
                          className='cursor-pointer'
                          onClick={() => handleSelectResult(idea.title, idea.desc)}
                          isLoading={loading}
                        >
                          Open in Workspace <Icon icon={ICONS.arrowRight} className="ml-2" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}