/**
 * Supabase SERVICE ROLE client — for server-side API routes only.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row-Level Security.
 * This is safe because:
 *   - This file is ONLY imported by Next.js Route Handlers (src/app/api/...)
 *   - The service role key is never exposed to the browser bundle
 *   - Operations are scoped by the projectId passed from the authenticated client
 *
 * DO NOT import this in any component, hook, or client-side utility.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in environment. ' +
      'Add it to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n' +
      'Find it in: Supabase Dashboard → Project Settings → API → service_role (secret)'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
