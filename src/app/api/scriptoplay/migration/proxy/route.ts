
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch external resource: ${response.statusText}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(blob, {
      status: 200,
      statusText: "OK",
      headers
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
