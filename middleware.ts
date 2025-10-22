import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ['/chat', '/profile', '/wallet', '/farm', '/caro']
// Define auth routes that should redirect to home if user is already logged in
const authRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('chat-token')?.value
  const { pathname } = request.nextUrl

  // Check if it's a protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Check if it's an auth route
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // Redirect to home if already authenticated
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes should run the middleware
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
