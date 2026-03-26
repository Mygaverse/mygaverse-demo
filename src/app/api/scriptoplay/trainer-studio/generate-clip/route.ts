import { NextResponse } from 'next/server';
import { createClient } from '@/lib/scriptoplay/supabase/server';
import { fal } from '@fal-ai/client';

// POST: Submit a training clip generation job (LTX-2 19B Pro mode)
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

    const {
      imageUrl,
      prompt,
      cameraLora,    // 'static' | 'dolly_in' | 'dolly_out' | 'zoom_in' | 'pan_left' | 'pan_right'
      duration = 3,  // Training clips: 2–4s sweet spot
    } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: 'imageUrl and prompt are required' }, { status: 400 });
    }

    const negativePrompt = 'blurry, motion smear, morphing, distorted, floating, sliding, photorealistic, realistic skin, 3D render, CGI';

    // LTX-Video optimal parameters for motion and quality
    const input: any = {
      image_url: imageUrl,
      prompt,
      negative_prompt: negativePrompt,
      duration: 3.5,
      aspect_ratio: '4:3',
      num_inference_steps: 50,
      guidance_scale: 3.5, // 5.0 is too high for video; causes stiffness. Default is 3.0.
      use_multiscale: true,
      // STG (Spatiotemporal Guidance) is CRITICAL for LTX-Video coherence and motion
      stg_mode: true,
      stg_scale: 1.5,
      stg_rescale: 0.7,
      stg_applied_layers_val: 12,
      ...(cameraLora && cameraLora !== 'static' && {
        camera_motion: cameraLora, // use native camera motion if available
      }),
    };

    console.log('[Trainer Studio] Submitting LTX-2 Pro clip:', { prompt: prompt.slice(0, 80), cameraLora });

    const endpoint = 'fal-ai/ltx-video/image-to-video';
    const { request_id } = await fal.queue.submit(endpoint, { input });

    return NextResponse.json({ requestId: request_id, model: endpoint });

  } catch (error: any) {
    console.error('[Trainer Studio] generate-clip POST error:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}

// GET: Poll clip status
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const modelEndpoint = searchParams.get('model') || 'fal-ai/ltx-video/image-to-video';
    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });

    console.log('[Trainer Studio] Polling clip status:', { requestId, modelEndpoint });

    // Wrap Fal status call to gracefully handle stale/expired requestIds (Fal throws 404)
    let status: any;
    try {
      status = await fal.queue.status(modelEndpoint, { requestId, logs: false } as any);
    } catch (falErr: any) {
      console.error('[Trainer Studio] fal.queue.status error (likely stale or unknown requestId):', falErr?.message || falErr);
      // Return failed (not 500) so the UI stops polling and marks the clip as failed
      return NextResponse.json({ status: 'failed', error: falErr?.message || 'Request not found on Fal' });
    }

    console.log('[Trainer Studio] Fal status response:', status?.status);

    if (status.status === 'COMPLETED') {
      let result: any;
      try {
        result = await fal.queue.result(modelEndpoint, { requestId } as any);
      } catch (resultErr: any) {
        console.error('[Trainer Studio] fal.queue.result error:', resultErr?.message);
        return NextResponse.json({ status: 'failed', error: 'Could not fetch result' });
      }
      const videoUrl =
        result?.data?.video?.url ||
        result?.video?.url ||
        result?.data?.video_url ||
        null;
      console.log('[Trainer Studio] Clip completed, videoUrl:', videoUrl ? 'found' : 'MISSING',
        JSON.stringify(result?.data || result).slice(0, 200));
      return NextResponse.json({ status: 'completed', videoUrl });
    }

    if (status.status === 'FAILED') {
      console.error('[Trainer Studio] Fal reported clip FAILED:', status);
      return NextResponse.json({ status: 'failed', error: status.error || 'Generation failed on Fal' });
    }

    return NextResponse.json({ status: 'processing' });

  } catch (error: any) {
    console.error('[Trainer Studio] GET polling unexpected error:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Status check failed' }, { status: 500 });
  }
}
