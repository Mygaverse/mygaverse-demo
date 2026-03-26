import { NextResponse } from 'next/server';
import { createClient } from '@/lib/scriptoplay/supabase/server';
import { orchestrator } from '@/lib/scriptoplay/orchestrator';

// POST: Generate a trainer asset image using Flux Pro (same model as main pipeline)
export async function POST(req: Request) {
  try {
    // Auth guard: trainer or admin only
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('access_status')
      .eq('id', user.id)
      .single();

    const role = profile?.access_status;
    if (role !== 'trainer' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: trainer or admin role required' }, { status: 403 });
    }

    const { prompt, characterName } = await req.json();
    if (!prompt || !characterName) {
      return NextResponse.json({ error: 'prompt and characterName are required' }, { status: 400 });
    }

    const fullPrompt = `${prompt}`.trim();

    // Use the same orchestrator as the main user pipeline (Flux Pro v1.1)
    const imageUrl = await orchestrator.generateImage({
      model: 'fal-ai/flux-pro/v1.1',
      prompt: fullPrompt,
      aspect_ratio: '4:3',
    });

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from generation model' }, { status: 500 });
    }

    // Attempt to save to trainer_images table (may not exist until SQL migration is run)
    const { data: savedImage, error: dbError } = await supabase
      .from('trainer_images')
      .insert({
        user_id: user.id,
        url: imageUrl,
        name: characterName,
        prompt: fullPrompt,
        character_name: characterName,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Trainer] DB save error (run the trainer_images SQL migration):', dbError.message);
      // Return image even if DB save fails so trainer doesn't lose the result
      return NextResponse.json({ imageUrl, saved: false });
    }

    return NextResponse.json({
      imageUrl,
      saved: true,
      id: savedImage.id,
    });

  } catch (error: any) {
    console.error('[Trainer] generate-image error:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
