import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl?.pathname
    if (!pathname) {
      return supabaseResponse
    }

    const isAuthPage = pathname.startsWith("/auth")
    const isApiRoute = pathname.startsWith("/api")
    const isPublicAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon")
    const isPublicPage = pathname === "/privacy" || pathname === "/terms" || pathname === "/cookies"

    // Check if guest mode is requested (from localStorage check on client or via cookie)
    const guestModeCookie = request.cookies.get("guest-mode")
    const isGuestMode = guestModeCookie?.value === "true"

    // Redirect to login if not authenticated and trying to access protected routes
    // BUT allow access to homepage if in guest mode and allow public pages
    if (!user && !isAuthPage && !isPublicAsset && !isPublicPage && !isGuestMode) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect to home if authenticated and trying to access auth pages
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    // Continue without redirecting on error
  }

  return supabaseResponse
}
