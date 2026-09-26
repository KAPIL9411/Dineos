/**
 * Next.js Proxy (formerly middleware).
 * Runs on every matched request before it reaches a route.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session cookie so it stays alive on navigation.
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from auth pages.
 *
 * Authorization (role checks, tenant checks) is NOT done here — it belongs
 * inside each route handler / server action where the full context is available.
 * See docs/20-SECURITY.md for the rationale.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/kitchen', '/delivery', '/admin']
const AUTH_PAGES = ['/login', '/signup', '/reset-password']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Refresh session — this updates the Set-Cookie header on the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT against Supabase — do not use getSession() here
  // because it reads from the cookie without server-side validation.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page))

  // Unauthenticated user trying to reach a protected route → send to login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting login/signup → send to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
