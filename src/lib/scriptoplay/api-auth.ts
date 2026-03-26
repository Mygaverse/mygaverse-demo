/**
 * API Route Auth Guard
 *
 * Call `requireAuth(req)` at the TOP of every expensive API route.
 * Returns the authenticated user, or a 401 NextResponse to return immediately.
 *
 * Usage:
 *   const authResult = await requireAuth(req);
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 *
 * This prevents unauthenticated callers from burning FAL/Supabase credits
 * even if the API URL is discovered from the public GitHub repo.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/scriptoplay/supabase/server';

export async function requireAuth(
  _req?: Request // reserved for future header-based auth (e.g. API keys)
): Promise<{ user: { id: string; email?: string } } | NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — valid session required.' },
        { status: 401 }
      );
    }

    return { user: { id: user.id, email: user.email } };
  } catch {
    return NextResponse.json(
      { error: 'Auth check failed.' },
      { status: 401 }
    );
  }
}
