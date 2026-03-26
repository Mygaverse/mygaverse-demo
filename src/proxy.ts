import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const path = request.nextUrl.pathname;

  // Only run Scriptoplay auth logic for Scriptoplay routes
  if (path.startsWith('/scriptoplay')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    let user = null;
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user;
    } catch (e) {
      // Proceed as unauthenticated if fetch fails
    }

    const isProtectedRoute = path.startsWith('/scriptoplay/dashboard');
    const isLoginRoute = path === '/scriptoplay/login';

    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/scriptoplay/login', request.url))
    }

    if (isLoginRoute && user) {
      return NextResponse.redirect(new URL('/scriptoplay/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
