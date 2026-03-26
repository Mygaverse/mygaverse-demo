import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}` }, { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
