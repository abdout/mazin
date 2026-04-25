import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { i18n, type Locale } from '@/components/internationalization/config'
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  publicRoutePrefixes,
  communityAllowedPrefixes,
  DEFAULT_LOGIN_REDIRECT,
  COMMUNITY_LOGIN_REDIRECT,
} from '@/routes'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

// 20 credential-bearing submissions per minute per IP.
const AUTH_RATE_LIMIT_MAX = 20
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale
  }

  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase()

  if (preferredLocale && i18n.locales.includes(preferredLocale as Locale)) {
    return preferredLocale
  }

  return i18n.defaultLocale
}

/**
 * Verify the Auth.js v5 session JWT.
 *
 * When `AUTH_JWT_VERIFY=lax` (or `AUTH_SECRET` is missing), falls back to
 * cookie-presence — matches the legacy behavior so the flag flip is
 * reversible without redeploy. Default is strict verification.
 */
/**
 * Decode the session JWT. Skipped entirely in lax mode or when no secret is
 * configured — in those cases we can't trust payload fields like `type`, so
 * community-guard + post-login routing fall back to staff-default behaviour.
 */
async function getSessionToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  const mode = process.env.AUTH_JWT_VERIFY ?? 'strict'
  if (mode === 'lax' || !secret) return null
  return getToken({
    req: request,
    secret,
    salt: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  })
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  const mode = process.env.AUTH_JWT_VERIFY ?? 'strict'

  if (mode === 'lax' || !secret) {
    return (
      !!request.cookies.get('authjs.session-token')?.value ||
      !!request.cookies.get('__Secure-authjs.session-token')?.value
    )
  }

  const token = await getSessionToken(request)
  return !!token
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isLoggedIn = await isAuthenticated(request)

  const localeMatch = pathname.match(/^\/(ar|en)/)
  const locale = localeMatch ? localeMatch[1] : null
  const pathnameWithoutLocale = locale ? pathname.replace(`/${locale}`, '') || '/' : pathname

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix)

  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale) ||
    publicRoutePrefixes.some(prefix => pathname.startsWith(prefix))
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale)

  // Rate limit credential-bearing POSTs on auth endpoints. GETs and session
  // polls are free so Auth.js's SessionProvider doesn't trip the limiter.
  if (request.method === 'POST' && (isAuthRoute || isApiAuthRoute)) {
    const ip = getClientIp(request.headers)
    const { limited } = rateLimit('auth', ip, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // All /api/* routes are locale-free — skip locale redirection and guards.
  // Cron, invoice PDF, statement PDF, health endpoints live under /api.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

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

  if (isAuthRoute && isLoggedIn) {
    const token = await getSessionToken(request).catch(() => null)
    const redirectPath = token?.type === 'COMMUNITY'
      ? COMMUNITY_LOGIN_REDIRECT
      : DEFAULT_LOGIN_REDIRECT
    return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}${redirectPath}`, request.nextUrl))
  }

  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}/login?callbackUrl=${callbackUrl}`, request.nextUrl))
  }

  // Community users cannot access staff surfaces. Staff users can access everything.
  if (isLoggedIn && !isPublicRoute && !isAuthRoute) {
    const token = await getSessionToken(request).catch(() => null)
    if (token?.type === 'COMMUNITY') {
      const allowed = communityAllowedPrefixes.some(prefix =>
        pathnameWithoutLocale === prefix || pathnameWithoutLocale.startsWith(`${prefix}/`)
      )
      if (!allowed) {
        return NextResponse.redirect(
          new URL(`/${locale || i18n.defaultLocale}${COMMUNITY_LOGIN_REDIRECT}`, request.nextUrl)
        )
      }
    }
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
