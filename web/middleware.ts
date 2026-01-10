import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Rutter som kräver inloggning
const protectedRoutes = ['/inventory', '/open']

// Rutter som bara ska vara tillgängliga för utloggade användare
const authRoutes = ['/auth/signin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('ghost-session')?.value

  // Kolla om användaren är autentiserad
  let isAuthenticated = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || 'your-secret-key'
      )
      await jwtVerify(token, secret)
      isAuthenticated = true
    } catch {
      // Ogiltig token
      isAuthenticated = false
    }
  }

  // Skyddade rutter - kräver inloggning
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/api/auth/steam', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth-rutter - omdirigera inloggade användare
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Matcha alla skyddade rutter
    '/inventory/:path*',
    '/open/:path*',
    '/auth/:path*',
  ],
}
