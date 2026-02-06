import { type NextRequest, NextResponse } from 'next/server'
import { i18n, type Locale } from '@/components/internationalization/config'
import { apiAuthPrefix, authRoutes, publicRoutes, publicRoutePrefixes, DEFAULT_LOGIN_REDIRECT } from '@/routes'

// Simple in-memory rate limiter for auth endpoints (Edge-compatible)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale
  }

  // Simple Accept-Language parsing for Edge runtime
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase()

  if (preferredLocale && i18n.locales.includes(preferredLocale as Locale)) {
    return preferredLocale
  }

  return i18n.defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth session token (JWT)
  const sessionToken = request.cookies.get('authjs.session-token')?.value
    || request.cookies.get('__Secure-authjs.session-token')?.value
  const isLoggedIn = !!sessionToken

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(ar|en)/)
  const locale = localeMatch ? localeMatch[1] : null
  const pathnameWithoutLocale = locale ? pathname.replace(`/${locale}`, '') || '/' : pathname

  // Check if the route is API auth
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix)

  // Check route types (without locale prefix)
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale) ||
    publicRoutePrefixes.some(prefix => pathname.startsWith(prefix))
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale)

  // Rate limit auth endpoints
  if (isAuthRoute || isApiAuthRoute) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }
  }

  // Allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Handle locale redirect
  const pathnameHasLocale = i18n.locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  )

  if (!pathnameHasLocale) {
    const detectedLocale = getLocale(request)
    const url = request.nextUrl.clone()
    url.pathname = `/${detectedLocale}${pathname}`

    const response = NextResponse.redirect(url)
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }

  // Redirect logged in users away from auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}${DEFAULT_LOGIN_REDIRECT}`, request.nextUrl))
  }

  // Protect non-public routes
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}/login?callbackUrl=${callbackUrl}`, request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav|pdf|ico)$).*)',
  ],
}
