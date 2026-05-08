# Mazin Production Security Audit — Findings

**Repo:** `/Users/abdout/mazin` · **Date:** 2026-05-08 · Verified against actual code, not docs.

Severity: **P0** = ship-blocker · **P1** = ship-before-GA · **P2** = post-launch.
Doc-contradiction tags: **[CONTRADICTS DOC]** when code disagrees with `docs/production-readiness-epics.md` framing or `_resume.md` "Phase 1 — Done" claim.

---

## 1) Rate limiting

### P0 — In-memory `Map` rate limiter, not Redis/Upstash
- `src/lib/rate-limit.ts:27` declares `const buckets = new Map<...>` — pure in-memory, exactly what Epic 1.1 says must be replaced.
- The file's own comment at `src/lib/rate-limit.ts:5-13` says "Acceptable pre-GA … Swap to `@upstash/ratelimit` … before GA." `_resume.md:73-94` claims **Phase 1 — Done**, implying rate-limiting epic complete; it is **not**. **[CONTRADICTS `_resume.md`]**
- Fix: install `@upstash/ratelimit` + `@upstash/redis`, add `UPSTASH_REDIS_REST_URL`/`_TOKEN` to `src/lib/env.ts`, rewrite `rateLimit()` as a sliding-window Redis client.

### P0 — Public tracking endpoint has NO rate limit (scrape-able)
- `src/actions/tracking.ts:61-97` `getPublicTracking(identifier)` runs Prisma queries with zero throttling. Anyone can brute-enumerate `TRK-XXXXXX` numbers.
- Page caller `src/app/[lang]/track/[trackingNumber]/page.tsx:52` has no protection either.
- Epic 1.2 lists this exact endpoint as P0; no implementation exists in code.
- Fix: wrap in `rateLimit('public-track', ip, 30, 5*60_000)` (after Redis swap) and return `429` with `Retry-After`.

### P0 — Login/register/reset have only one bucket, no per-email lockout
- `src/middleware.ts:92-101` rate-limits ALL POSTs to auth routes at 20/minute/IP. There is **no per-email** bucket and **no per-action** differentiation.
- `src/components/auth/login/action.ts`, `src/components/auth/join/action.ts:13`, `src/components/auth/reset/action.ts:11` and `src/components/auth/password/action.ts:12` (newPassword) contain **zero** rate-limit calls.
- A single attacker IP rotation defeats the per-IP cap. Epic 1.3 demands 5/15min/email + 20/15min/IP; not implemented.
- Fix: add per-action+per-email buckets in each server action; integrate after Redis swap.

### P1 — PDF endpoints have NO rate limit and NO timeout
- `src/app/api/invoice/[id]/pdf/route.ts:46` and `src/app/api/statement/[id]/pdf/route.ts:40` call `renderToBuffer(...)` with no rate limit and no timeout wrapper. A buggy/malicious user can exhaust Vercel function minutes (10s ceiling). Epic 1.4 explicitly lists this. **[CONTRADICTS DOC: claimed only "verify", but no protection in code.]**
- Fix: wrap in `Promise.race([renderToBuffer(...), timeout(8000)])` and add `rateLimit('pdf-export', userId, 10, 5*60_000)`.

### P1 — Chatbot rate limit also in-memory, separate bucket
- `src/components/chatbot/actions.ts:27-28` keeps **two** `Map<string, …>` (rateLimitMap, dailyLimitMap). Inconsistent with `src/lib/rate-limit.ts`; same cold-start-evaporation problem. Epic 34.1 references this. Fix: replace with the shared rate-limit helper (which itself needs Redis).

---

## 2) NextAuth v5 config

### P1 — `session.maxAge` not set (defaults to 30 days)
- `src/auth.ts:184` is `session: { strategy: "jwt" }` only — no `maxAge`, no `updateAge`. NextAuth defaults JWT max-age to 30 days.
- Epic 3.2 calls for 7-day max-age + 24h `updateAge`. **[CONTRADICTS DOC if marked done; not implemented.]**
- Fix: `session: { strategy: "jwt", maxAge: 7*24*60*60, updateAge: 24*60*60 }`.

### P1 — `trustHost: true` unconditional in production
- `src/auth.ts:187` is `trustHost: true` with no env gate. Epic 3.4 wants this gated behind `NODE_ENV !== 'production' || VERCEL === '1'`.
- Fix: `trustHost: process.env.NODE_ENV !== 'production' || process.env.VERCEL === '1'`.

### P1 — No `cookies` block; defaults relied on
- `src/auth.ts:36-188` and `src/auth.config.ts` neither define a `cookies` config nor explicit SameSite policy. Auth.js v5 defaults give `SameSite=Lax` for the session cookie — acceptable but not documented; combined with the lax middleware fallback (below) it weakens CSRF posture.
- Fix: explicit `cookies.sessionToken.options = { sameSite: 'lax', secure: prod, httpOnly: true }` and consider `Strict` for `__Host-`-prefixed cookies in production.

### P2 — JWT callback DB-hits on every request
- `src/auth.ts:164-181` `jwt()` calls `getUserById(token.sub)` + `getAccountByUserId()` on every JWT refresh — degrades performance, but more importantly leaks live role into session without revocation flag.
- Epic 3.6 wants `User.sessionsRevokedAt` + check `iat >= sessionsRevokedAt`. Not implemented.
- Fix: add `sessionsRevokedAt` and short-circuit in `jwt()` when `iat < sessionsRevokedAt.getTime()/1000` → return null token.

### P0 — Role propagation: STAFF default role is `CLERK` for OAuth signups
- `src/auth.config.ts:28` (Google) and `:58` (Facebook) hardcode `role: "CLERK" as const, ... emailVerified: new Date()`. Anyone with a Google login auto-receives CLERK staff role and bypasses email verification check at `src/auth.ts:127`.
- Combined with the public OAuth providers always-enabled if env keys present, this is an **escalation path to staff**.
- Fix: OAuth signups should default to `type: "COMMUNITY", role: "VIEWER"` — never CLERK; staff promotion only via invite (`src/components/platform/settings/team/actions.ts:122 acceptInvite`).

---

## 3) Middleware JWT verify

### P0 — "lax" fallback present; can be flipped via env
- `src/middleware.ts:47-58` `getSessionToken` returns `null` whenever `AUTH_JWT_VERIFY=lax` or `AUTH_SECRET` missing.
- `src/middleware.ts:60-73` `isAuthenticated` then trusts mere cookie presence (`authjs.session-token` value). An attacker can forge the cookie to ANY string and pass middleware.
- Epic 3.3 demands removal in production. The flag is still readable from `src/lib/env.ts:41`. **[CONTRADICTS DOC if "done"; still active.]**
- Fix: in production, remove the `mode === 'lax'` branch entirely; only fall back when `NODE_ENV !== 'production'`.

### P1 — Public route prefixes are locale-prefixed but check uses inconsistent stripping
- `src/middleware.ts:80-88` strips locale only for one match, but `publicRoutePrefixes` at `src/routes.ts:35-40` are themselves locale-prefixed (`/en/track/`, `/ar/track/`). The `pathname.startsWith(prefix)` test at `:87` runs against the un-stripped pathname, which works — but `publicRoutes` includes both `/en` and `/ar` entries (`src/routes.ts:18-29`) creating risk of drift if a third locale is added.
- Also: the `pathname.startsWith('/api/')` early-return at `src/middleware.ts:109-111` lets ALL /api/* routes through unauthenticated. While each route does its own check, missing-auth on a future API route would slip through silently.

### P2 — `isAuthenticated` re-decodes JWT a second time per request
- `src/middleware.ts:71` calls `getSessionToken` from inside `isAuthenticated`, then `:132` decodes again, then `:146` decodes a third time. Three crypto round-trips per page load.

---

## 4) CSP / security headers

### P0 — `'unsafe-inline'` AND `'unsafe-eval'` in script-src
- `next.config.ts:47` `"script-src 'self' 'unsafe-eval' 'unsafe-inline'"`. Both directives nullify CSP's XSS protection. Epic 3.1 lists this as P0. **[CONTRADICTS DOC if "done".]**
- Fix: use nonce-based CSP, or migrate to React Server Components-only and drop `unsafe-eval`. Configure `report-uri` to Sentry.

### P1 — `style-src 'unsafe-inline'`
- `next.config.ts:48`. Tailwind/Radix inject styles inline. Less critical than script-src, but still leaves attack surface.

### P1 — `connect-src 'self' https://*.vercel.app`
- `next.config.ts:51` allows `https://*.vercel.app` — extremely broad; any preview deployment of any Vercel customer becomes allow-listed for fetches/exfil. Reduce to a specific app domain.

### Positive (no fix): `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` are correctly set at `next.config.ts:24-43`.

---

## 5) CAPTCHA / honeypot

### P0 — Zero CAPTCHA, zero honeypot anywhere
- Grep `turnstile|hcaptcha|recaptcha|honeypot` over the entire `src/` tree returned **no matches**.
- `src/components/auth/join/form.tsx:26-130` (register), `src/components/auth/reset/form.tsx:29-112` (password reset), `src/components/platform/marketplace/actions.ts:91 registerVendor` are all unprotected against bots.
- Epic 1.5 specifies hCaptcha/Turnstile + honeypot fallback. **[CONTRADICTS DOC if "done".]**
- Fix: integrate Cloudflare Turnstile (cheapest), add a hidden `website` honeypot field that, if set, fails closed.

### P1 — Email enumeration on `reset` and `register`
- `src/components/auth/reset/action.ts:22-24`: `if (!existingUser) return { error: "Email not found!" }` — confirms account existence by email.
- `src/components/auth/join/action.ts:25-27` same: `"Email already in use!"`.
- Marketplace correctly returns generic ("Registration failed") at `src/components/platform/marketplace/actions.ts:111-113` — apply that pattern.

---

## 6) Server-action auth/RBAC sample (10 files)

| File | `auth()`/`requireStaff` | `requireCan`/role check | Verdict |
|---|---|---|---|
| `src/components/platform/shipments/actions.ts` | YES (`requireStaff`) | YES (`requireCan`) | OK |
| `src/components/platform/customs/actions.ts` | YES | YES | OK |
| `src/components/platform/finance/timesheet/actions.ts` | YES | YES | OK |
| `src/components/platform/settings/team/actions.ts` | YES | YES | OK |
| `src/components/platform/finance/fees/actions.ts` | YES | YES (line 84-85) | OK |
| `src/components/platform/finance/receipt/actions.ts` | YES | YES | OK |
| `src/components/platform/customer/actions.ts:33-209` | YES | **NO** (only `userId` ownership) | P1 — VIEWER can create/update/delete clients |
| `src/components/platform/finance/accounts/actions.ts:74-291` | YES | **NO** | P0 — VIEWER can create/update/delete bank accounts |
| `src/components/platform/finance/payroll/actions.ts:163,221,398,...` | YES | **NO** | **P0 — any logged-in user can create employees, change salaries, run payroll** |
| `src/components/platform/finance/wallet/actions.ts:29-229` | YES | **NO** (only ownership of `Client.userId`) | P1 — VIEWER can deposit/drawdown wallets they "own" |
| `src/components/platform/finance/expenses/actions.ts` (12 actions) | YES | **NO** | P1 — VIEWER can submit/approve/reject expenses |
| `src/components/platform/finance/budget/actions.ts` (16 actions) | YES | **NO** | P1 — VIEWER can mutate budgets |

### P0 — Trusted role parameter in `getUpcomingData`
- `src/components/platform/dashboard/actions.ts:100`: `export async function getUpcomingData(role: UserRole)` — accepts `role` as an argument from the client. Caller can pass `"ADMIN"` regardless of the session's actual role. Switch at `:104` then dispatches to admin-only data fetcher (`getAdminUpcoming` `:117`).
- Fix: ignore `role` argument; resolve it from `session.user.role` server-side.

### P1 — Server actions return raw error.message to client
- Many actions (e.g. `src/components/platform/finance/accounts/actions.ts:88, 122, 182, 248, 288`) return `error: err instanceof Error ? err.message : "..."`, which can leak Prisma error strings (table names, column hints) to clients.
- Fix: log server-side, return generic "Failed to update account" only.

---

## 7) Secrets & env validation

### P1 — Optional vars that gate critical features fail open
- `src/lib/env.ts:36-38` makes `AUTH_SECRET` required only in production via `isProduction ? required : optional`. OK.
- BUT `RESEND_API_KEY` (`:58`), `CRON_SECRET` (`:74`), `WHATSAPP_ACCESS_TOKEN` (`:78`), and Plaid/AWS keys are all `.optional()`. The cron route at `src/app/api/cron/demurrage/route.ts:18-25` correctly fails-closed on missing `CRON_SECRET`. Good. But:
  - Resend wrapper is not in this audit's read but Epic 1.6 calls for boot-time throw; current `optional()` means missing key produces silent failures at send time.
- Fix: split required-in-prod vars into a stricter group, throw at first email/whatsapp call if absent.

### P1 — Env parsing falls back to `rawEnv` in dev on failure
- `src/lib/env.ts:230` `cached = (result.success ? result.data : (rawEnv as unknown as Env))` — silently masks development-time misconfiguration. Production still throws (`:198-201`), so not a P0, but `console.warn` is easy to miss in dev.

### Positive: lazy Proxy avoids edge-bundle bloat (`src/lib/env.ts:244-267`).

---

## 8) CompanySettings encryption

### P1 — `whatsappAccessToken`, `whatsappBusinessId` not stored encrypted
- `prisma/models/company.prisma:50-51`: `whatsappPhoneNumberId String?` and `whatsappBusinessId String?` — plain `String?`, no encryption.
- The `whatsappAccessToken` field referenced in Epic 3.8 is **not even present** in the schema yet (Mazin currently uses env var `WHATSAPP_ACCESS_TOKEN` per `src/lib/env.ts:78`). When tenants get their own credentials, you must encrypt before persisting.
- `PLAID_SECRET` is in env (`src/lib/env.ts:70`) — plaintext — and used directly at `src/components/platform/finance/banking/lib/plaid.ts:32: secret: process.env.PLAID_SECRET`.

### P0 — `encryptId`/`decryptId` is **fake** Base64, not encryption
- `src/components/platform/finance/banking/lib/utils.ts:145-151`: `encryptId = btoa(id)`, `decryptId = atob(id)`. Anyone reading this code or the URL can reverse it instantly. Naming it `encrypt*` is misleading and would fool a future engineer.
- Fix: rename to `encodeId`/`decodeId`, or replace with HMAC-signed tokens.

---

## 9) Account lockout / 2FA

### P0 — No `failedLoginCount` / `lockedUntil` columns
- `prisma/models/auth.prisma:16-92` `User` has no `failedLoginCount`, `lockedUntil`, `lastLoginAt`, or `sessionsRevokedAt` fields. Epic 3.5 demands lockout after 10 failures in 15 min.
- `src/components/auth/login/action.ts:113-115` only logs `"Invalid credentials!"` — no DB-side counter increment. `_resume.md` claims Phase 1 done but this is missing. **[CONTRADICTS `_resume.md`.]**

### P1 — 2FA exists but is opt-in and not enforced for staff
- `prisma/models/auth.prisma:28`: `isTwoFactorEnabled Boolean @default(false)` — opt-in.
- `src/auth.ts:129-138` enforces 2FA only when `existingUser.isTwoFactorEnabled === true`.
- Epic 30 calls for "2FA enforcement". For ADMIN/MANAGER roles, 2FA should be mandatory.
- Fix: in the credentials authorize flow, require `isTwoFactorEnabled` if `role in ['ADMIN','MANAGER']` and reject otherwise.

### Positive: 2FA flow itself is correct: confirmation token deleted post-use (`src/components/auth/login/action.ts:70-72`), TwoFactorConfirmation cleared on next signIn (`src/auth.ts:135-137`).

---

## 10) CSRF

### P1 — No Origin/Referer enforcement on state-changing routes
- Grep over `src/middleware.ts`, `src/auth.ts`, `src/auth.config.ts`, `src/lib/` returned **zero** `Origin` or `Referer` checks.
- NextAuth's built-in CSRF token protects `/api/auth/*` only; server actions and `/api/invoice/[id]/pdf`, `/api/statement/[id]/pdf` rely on cookie SameSite alone.
- Epic 3.7 specifies double-submit token or `SameSite=Strict` for state-changing routes; cookie SameSite is unset (Auth.js default is `Lax`).
- Fix: add a `checkOrigin(request)` guard in middleware for `POST/PUT/PATCH/DELETE` that verifies `Origin` matches `AUTH_URL`. Set session cookie `SameSite=Strict` in production.

### P2 — `NEXT_LOCALE` cookie set with `sameSite: 'lax'`
- `src/middleware.ts:125`: harmless for the locale cookie itself, but worth noting that this is the only explicit SameSite assignment in the entire repo.

---

## Summary table

| # | Severity | One-liner | Cite |
|---|---|---|---|
| 1 | P0 | Rate limiter is in-memory `Map`, not Redis | `src/lib/rate-limit.ts:27` |
| 2 | P0 | Public tracking endpoint has no rate limit | `src/actions/tracking.ts:61` |
| 3 | P0 | Login/register/reset/newPassword actions have no per-email rate limit | `src/components/auth/login/action.ts:19`, `join/action.ts:13`, `reset/action.ts:11`, `password/action.ts:12` |
| 4 | P0 | Middleware allows cookie-only "lax" auth fallback | `src/middleware.ts:47-73` |
| 5 | P0 | Google/Facebook OAuth auto-grants `CLERK` staff role | `src/auth.config.ts:28, 58` |
| 6 | P0 | CSP includes `'unsafe-inline'` and `'unsafe-eval'` | `next.config.ts:47` |
| 7 | P0 | Zero CAPTCHA/honeypot on register, reset, vendor signup | `src/components/auth/{join,reset}/form.tsx` |
| 8 | P0 | Payroll mutations (createEmployee, createPayrollRun, salary updates) lack role/permission check | `src/components/platform/finance/payroll/actions.ts:163,221,398` |
| 9 | P0 | Bank account create/update/delete lack role check | `src/components/platform/finance/accounts/actions.ts:126,187,256` |
| 10 | P0 | `getUpcomingData(role)` accepts role from client | `src/components/platform/dashboard/actions.ts:100` |
| 11 | P0 | `encryptId/decryptId` is `btoa/atob` masquerading as encryption | `src/components/platform/finance/banking/lib/utils.ts:145-151` |
| 12 | P0 | No `failedLoginCount`/`lockedUntil` in User model — no lockout | `prisma/models/auth.prisma:16-92` |
| 13 | P1 | `session.maxAge`/`updateAge` not configured (defaults to 30d) | `src/auth.ts:184` |
| 14 | P1 | `trustHost: true` unconditional | `src/auth.ts:187` |
| 15 | P1 | PDF endpoints have no rate limit and no timeout | `src/app/api/invoice/[id]/pdf/route.ts:46`, `statement/[id]/pdf/route.ts:40` |
| 16 | P1 | Email-enumeration in reset/register success messages | `src/components/auth/reset/action.ts:22`, `join/action.ts:25` |
| 17 | P1 | Customer/wallet/expenses/budget actions lack role check (auth-only) | `src/components/platform/customer/actions.ts:33`, `finance/wallet/actions.ts:29`, `finance/expenses/actions.ts:59`, `finance/budget/actions.ts` |
| 18 | P1 | 2FA opt-in only; not enforced for ADMIN/MANAGER | `src/auth.ts:129`, `prisma/models/auth.prisma:28` |
| 19 | P1 | No Origin/Referer enforcement on state-changing routes | `src/middleware.ts` (entire file) |
| 20 | P1 | `style-src 'unsafe-inline'`, `connect-src https://*.vercel.app` overly broad | `next.config.ts:48,51` |
| 21 | P1 | Chatbot rate limit also in-memory `Map`, separate buckets | `src/components/chatbot/actions.ts:27-28` |
| 22 | P1 | `whatsappAccessToken`/`PLAID_SECRET` not encrypted at rest (env-plaintext); `CompanySettings` has no encryption helpers | `prisma/models/company.prisma:50-51`, `src/components/platform/finance/banking/lib/plaid.ts:32` |
| 23 | P2 | JWT callback re-fetches User on every request (perf + revocation gap) | `src/auth.ts:164-181` |
| 24 | P2 | No `cookies` block in NextAuth config (relies on defaults) | `src/auth.ts:36-188` |
| 25 | P2 | Auth.js NextAuth config lacks `sessionsRevokedAt` invariant | `prisma/models/auth.prisma`, `src/auth.ts:164` |

---

## Three highest-leverage fixes (pick first)

1. **Wire Upstash Redis once, reuse everywhere** — fixes findings #1, #2, #3, #15, #21 with one helper rewrite.
2. **Add `requireStaff` + `requireCan('approve','finance')` to payroll/accounts/wallet/expenses/budget actions** — closes findings #8, #9, #17 in one PR.
3. **Tighten CSP + `session.maxAge` + remove `lax` mode + add Turnstile** — flips findings #4, #6, #7, #13 from P0 to closed.
