import { type NextRequest, NextResponse } from 'next/server'
import { i18n, type Locale } from '@/components/internationalization/config'
import { apiAuthPrefix, authRoutes, publicRoutes, DEFAULT_LOGIN_REDIRECT } from '@/routes'

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
  const isPublicRoute = publicRoutes.includes(pathnameWithoutLocale)
  const isAuthRoute = authRoutes.includes(pathnameWithoutLocale)

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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
