import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function toSessionCookie<T extends { maxAge?: number; expires?: Date | number | string }>(options: T) {
  const { maxAge, expires, ...rest } = options ?? ({} as T)
  return rest
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured yet, let every request through so the
  // marketing site keeps working. The portal simply can't be signed into.
  if (!url || !anonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, toSessionCookie(options)),
        )
      },
    },
  })

  // Do not run code between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPortal = pathname.startsWith("/portal")
  const isLogin = pathname === "/portal/login"

  // Protect the portal: unauthenticated visitors are sent to the login page.
  if (isPortal && !isLogin && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/portal/login"
    return NextResponse.redirect(redirectUrl)
  }

  // Signed-in owner shouldn't sit on the login page.
  if (isLogin && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/portal/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
