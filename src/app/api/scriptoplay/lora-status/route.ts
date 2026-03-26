import { NextResponse } from 'next/server';
import { createClient } from '@/lib/scriptoplay/supabase/server';
import { fal } from '@fal-ai/client';

export async function GET(req: Request) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const model = searchParams.get('model') || 'fal-ai/flux-lora-fast-training';

    if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });

    const status: any = await fal.queue.status(model, { requestId, logs: false } as any);

    if (status.status === 'COMPLETED') {
      const result: any = await fal.queue.result(model, { requestId } as any);
      const loraUrl =
        result?.data?.diffusers_lora_file?.url ||
        result?.diffusers_lora_file?.url ||
        null;

      if (!loraUrl) {
        console.error('[LoRA Status] Completed but no loraUrl found:', JSON.stringify(result).slice(0, 300));
        return NextResponse.json({ status: 'failed', error: 'No LoRA URL in result' });
      }
      return NextResponse.json({ status: 'ready', loraUrl });
    }

    if (status.status === 'FAILED') {
      return NextResponse.json({ status: 'failed', error: status.error || 'Training failed' });
    }

    return NextResponse.json({ status: 'training' });

  } catch (error: any) {
    console.error('[LoRA Status] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
