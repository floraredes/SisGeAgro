import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Get auth cookie for Supabase Auth
  const hasAuthCookie = req.cookies.has("supabase-auth-token") || req.cookies.has("sb-access-token")
  
  // Check for local user in cookies (if you want to store local user info in cookies)
  // For now, we'll rely on the client-side checks since localStorage is not available in middleware
  const isAuthenticated = hasAuthCookie
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isPublicPage = ["/"].includes(req.nextUrl.pathname)

  // If not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated && !isAuthPage && !isPublicPage) {
    const redirectUrl = new URL("/auth", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access auth page, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

