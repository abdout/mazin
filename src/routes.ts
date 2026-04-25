/**
 * Routes configuration for the application.
 * Used by middleware for authentication and authorization.
 */

/**
 * Public routes accessible without authentication.
 * These routes do not require the user to be logged in.
 */
export const publicRoutes = [
  "/",
  "/new-verification",
  // Marketing pages
  "/about",
  "/services",
  "/service",
  "/contact",
  // Internationalized routes
  "/en",
  "/en/about",
  "/en/services",
  "/en/service",
  "/en/contact",
  "/ar",
  "/ar/about",
  "/ar/services",
  "/ar/service",
  "/ar/contact",
]

/**
 * Public route prefixes.
 * Routes starting with these prefixes are publicly accessible.
 */
export const publicRoutePrefixes = [
  "/en/track/",
  "/ar/track/",
  "/en/join/invite/",
  "/ar/join/invite/",
]

/**
 * Authentication routes.
 * These routes are used for authentication flows.
 * Logged in users will be redirected away from these routes.
 */
export const authRoutes = [
  "/login",
  "/register",
  "/join",
  "/error",
  "/reset",
  "/new-password",
  // Internationalized auth routes
  "/en/login",
  "/en/join",
  "/en/error",
  "/en/reset",
  "/en/new-password",
  "/ar/login",
  "/ar/join",
  "/ar/error",
  "/ar/reset",
  "/ar/new-password",
]

/**
 * API authentication routes prefix.
 * Routes that start with this prefix are used for API authentication purposes.
 */
export const apiAuthPrefix = "/api/auth"

/**
 * The default redirect path after logging in.
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard"

/**
 * Where COMMUNITY users go after login (they can't reach /dashboard).
 */
export const COMMUNITY_LOGIN_REDIRECT = "/marketplace"

/**
 * Path prefixes (locale-stripped) that COMMUNITY users may access while
 * authenticated. Everything else is staff-only.
 */
export const communityAllowedPrefixes = [
  "/marketplace",
  "/track/",
  "/settings/profile",
  "/settings/security",
]
