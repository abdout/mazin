import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { type NextRequest, NextResponse } from 'next/server'
import { i18n, type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'
import { apiAuthPrefix, authRoutes, publicRoutes, DEFAULT_LOGIN_REDIRECT } from '@/routes'

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale
  }

  const acceptLanguageHeader = request.headers.get('accept-language') ?? ''
  const headers = { 'accept-language': acceptLanguageHeader }
  const languages = new Negotiator({ headers }).languages()

  return match(languages, i18n.locales, i18n.defaultLocale)
}

function localizationMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return null
  }

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`

  const response = NextResponse.redirect(request.nextUrl)
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

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

  // Handle locale redirect first
  const localeResponse = localizationMiddleware(req)
  if (localeResponse) {
    return localeResponse
  }

  // Redirect logged in users away from auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}${DEFAULT_LOGIN_REDIRECT}`, nextUrl))
    }
    return NextResponse.next()
  }

  // Protect non-public routes
  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/${locale || i18n.defaultLocale}/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

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
