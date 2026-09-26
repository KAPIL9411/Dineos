/**
 * Server-side Supabase clients.
 *
 * Two clients are exported:
 *  - createServerClient  – uses the anon key + user session cookies. Respects RLS.
 *    Use this for any query that should run as the authenticated user.
 *  - createServiceClient – uses the service role key. Bypasses RLS entirely.
 *    Use only in server route handlers where you need to act outside user scope
 *    (e.g. seeding a new tenant on signup, admin actions). NEVER import in client code.
 */
import 'server-only'
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createServerClient() {
  const cookieStore = await cookies()

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set there.
            // The proxy.ts refreshes the session so this is safe to ignore.
          }
        },
      },
    }
  )
}

/**
 * Service-role client — bypasses RLS.
 * Only for trusted server-side operations. Never send this client to the browser.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
