import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ['/chat', '/profile', '/wallet', '/farm', '/caro']
// Define auth routes that should redirect to home if user is already logged in
const authRoutes = ['/auth/login', '/auth/register']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('chat-token')?.value
  const { pathname } = request.nextUrl

  // Skip proxy for Next.js internal routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next()
  }

  // Allow auth routes without token (don't redirect)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // Only redirect to home if already authenticated
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Allow access to auth routes when not authenticated
    return NextResponse.next()
  }

  // Check if it's a protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes should run the proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
