import { NextResponse } from 'next/server';
import { createClient } from '@/lib/scriptoplay/supabase/server';
import { fal } from '@fal-ai/client';
import JSZip from 'jszip';

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

    const { imageUrls, triggerWord, characterName } = await req.json();

    if (!imageUrls?.length || !triggerWord) {
      return NextResponse.json({ error: 'imageUrls and triggerWord are required' }, { status: 400 });
    }

    if (imageUrls.length < 5) {
      return NextResponse.json({ error: `Need at least 5 images, got ${imageUrls.length}` }, { status: 400 });
    }

    console.log(`[Train LoRA] Starting for "${characterName}" — ${imageUrls.length} images, trigger: ${triggerWord}`);

    // Build zip: images + caption .txt files (trigger word as caption)
    const zip = new JSZip();
    for (let i = 0; i < imageUrls.length; i++) {
      const imgRes = await fetch(imageUrls[i]);
      if (!imgRes.ok) throw new Error(`Failed to fetch image ${i + 1}: ${imgRes.status}`);
      const imgBuffer = await imgRes.arrayBuffer();
      const ext = imageUrls[i].includes('.png') ? 'png' : 'jpg';
      const base = `image_${String(i + 1).padStart(3, '0')}`;
      zip.file(`${base}.${ext}`, imgBuffer);
      zip.file(`${base}.txt`, triggerWord); // Caption = trigger word only
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFile = new File([zipBlob], `${triggerWord}_training.zip`, { type: 'application/zip' });

    console.log(`[Train LoRA] Uploading zip (${imageUrls.length} images) to Fal storage...`);
    const zipUrl = await fal.storage.upload(zipFile);
    console.log(`[Train LoRA] Zip uploaded: ${zipUrl}`);

    const { request_id } = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
      input: {
        images_data_url: zipUrl,
        trigger_word: triggerWord,
        steps: 2500,
        create_masks: true,
        is_style: false,
      },
    });

    console.log(`[Train LoRA] Job submitted: ${request_id}`);

    return NextResponse.json({
      requestId: request_id,
      model: 'fal-ai/flux-lora-fast-training',
      triggerWord,
      characterName,
    });

  } catch (error: any) {
    console.error('[Train LoRA] Error:', error);
    return NextResponse.json({ error: error.message || 'Training submission failed' }, { status: 500 });
  }
}
