# Mazin Deployment / CI / Cron Audit

Date: 2026-05-08. Repo root: `/Users/abdout/mazin`.

## 1. Vercel config — `vercel.json`

- Framework `nextjs`, `public: true` (line 4) — fine for the marketing routes, but it disables Vercel-private deployment-protection on previews. If you want preview branches gated, this needs to come off.
- Crons declared (lines 5–14):
  - `/api/cron/reminders` `0 8 * * *` (daily 08:00 UTC)
  - `/api/cron/demurrage` `0 6 * * *` (daily 06:00 UTC)
- **No `regions` pinning** — Vercel will default to `iad1`. Neon is also typically `aws-east`, so latency is acceptable; pin explicitly if Mazin uses a non-US Neon region.
- **No `functions[*].maxDuration`** declared. The cron endpoints do bulk work (`task-reminders` + demurrage scan over all undelivered shipments). Default Hobby plan = 10 s; Pro = 60 s. If on Hobby this is a P1 risk.
- No `rewrites`, no `headers` — security headers come from `next.config.ts` (good).

## 2. GitHub Actions — `.github/workflows/ci.yml`

- Single workflow, two jobs:
  - **`quality`** (`ci.yml:14-53`): pnpm 10, Node 22, frozen-lockfile, `db:generate`, `type-check`, `lint`, `test` (vitest), `build`.
  - **`e2e`** (`ci.yml:55-120`): Postgres 16 service, `db:push` (not `migrate deploy`), Playwright with browser cache, conditional on PR or main.
- Concurrency configured (`ci.yml:9-11`).
- Build secrets sourced from `secrets.DATABASE_URL` and `AUTH_SECRET || NEXTAUTH_SECRET || 'ci-test-secret'` (line 53) — fallback string keeps CI green even when secret missing, **so a missing org secret won't fail loudly**.
- **Gaps:**
  - No production `prisma migrate deploy` step or `db:migrate` invocation anywhere — only `db:push` in E2E (line 106). Production migrations are not part of CI/CD.
  - No coverage upload, no Sentry source-map upload step (it's bundled into the `build` step via `withSentryConfig`, but `SENTRY_AUTH_TOKEN` is **not** in build env on line 51-53 → source maps will not upload).
  - No deploy step (Vercel is wired via Git integration, fine — but no post-deploy smoke against `/api/health`).
  - No branch-protection signal in workflow file (configured in GitHub settings, not visible here).
  - No security scan / `pnpm audit` job, no Dependabot config.

## 3. Env validation — `src/lib/env.ts`

- Required-in-prod: `DATABASE_URL` (line 28), `AUTH_SECRET` (line 36). Everything else `.optional()`.
- Validated as `.optional()`: NextAuth back-compat, OAuth providers, Resend, AI keys, Plaid, AWS S3 + CloudFront, Sentry, WhatsApp, `CRON_SECRET`.
- **Envs referenced in code but NOT validated in `env.ts`:**
  - `RESEND_FROM_EMAIL` — used at `src/lib/resend.ts:12`, declared in `.env.example:69`, **missing from `env.ts`**.
  - `VERCEL_URL` — used at `src/auth.ts:26-27`. Vercel-injected, ok to leave out, but worth a comment.
- **Envs in `.env.example` not in `env.ts`:** only `RESEND_FROM_EMAIL` (`.env.example:69`).
- **Inconsistency with `docs/deployment.md`:** `deployment.md:23-26` lists `NEXTAUTH_SECRET` + `NEXTAUTH_URL` as the required pair, but `env.ts:36-37` requires `AUTH_SECRET`. Operators following the docs may set the legacy names only and the build will throw.
- **Inconsistency:** `docs/deployment.md:41` lists `OPENWEATHER_API_KEY`; code uses `OPENWEATHERMAP_API_KEY` (`src/lib/env.ts:66`, `src/components/platform/dashboard/weather-actions.ts:95`).

## 4. Cron auth — both routes use `Authorization: Bearer ${CRON_SECRET}`

- **`/api/cron/reminders/route.ts`**:
  - `verifySecret` at lines 31-42 — reads `process.env.CRON_SECRET`, returns `false` when secret unset (good — fail-closed).
  - Idempotency: `withJobLock` with bucket `'day'` (line 60).
  - Sentry check-ins on `in_progress`, `ok`, `error` (lines 53-55, 65, 80).
  - Returns 401 unauth, 500 on body error, JSON `{ skipped: true }` when lock claims same bucket.
- **`/api/cron/demurrage/route.ts`**:
  - Same pattern at lines 18-25, 33-41, 44-148.
  - Per-shipment `notificationDedupKey` insert (lines 122-125) — second layer of idempotency at Notification table level.
- **JobRun model:** `prisma/models/operations.prisma:284-296`. Unique on `(jobName, scheduledFor)` — duplicate firings short-circuit on P2002 (verified in `src/lib/jobs/lock.ts:71-79`).
- ✓ Auth + idempotency are correctly wired for both crons.

## 5. Health endpoint — `src/app/api/health/route.ts`

- Exists. Runs `SELECT 1` via `db.$queryRaw` (line 12), returns `{ status, timestamp, uptime, database, latency }` (lines 21-29). 200 when DB up, 503 when DB down.
- ✓ Production-grade.

## 6. Sentry config — three files, all minimal

- `sentry.server.config.ts` (8 lines), `sentry.client.config.ts` (10 lines), `sentry.edge.config.ts` (8 lines):
  - DSN: `process.env.NEXT_PUBLIC_SENTRY_DSN` (single var across all three — server/edge should ideally fall back to `SENTRY_DSN`).
  - `enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN` (good — no-op when unset).
  - `tracesSampleRate: 0.1 prod / 1.0 dev` (consistent).
  - Client also has `replaysOnErrorSampleRate: 1.0` (line 8) — replay enabled on error only.
- **Gaps:**
  - No `tracePropagationTargets` set anywhere — distributed tracing across Vercel functions / external APIs will not stitch.
  - Server config does not consume `SENTRY_DSN` (only `NEXT_PUBLIC_SENTRY_DSN`). If you ever want to ship the server DSN without exposing it to the browser, this needs to read `process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN`.
  - No `release` / `environment` set — releases will be unsourced.
- **Source-map upload:** `next.config.ts:63-70` wraps with `withSentryConfig({ org, project, silent: !CI, widenClientFileUpload: true, automaticVercelMonitors: true })`. The plugin reads `SENTRY_AUTH_TOKEN` from env — **not passed in CI build env (`ci.yml:51-53`)**, so source maps won't upload from CI. They will upload from Vercel's build if `SENTRY_AUTH_TOKEN` is set in Vercel env.

## 7. `next.config.ts`

- `images.remotePatterns` (lines 5-17): unsplash, simpleicons, S3 wildcard, CloudFront wildcard. Fine.
- Security headers (lines 18-60): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy` (camera/mic/geo off), and a CSP at lines 44-55.
  - CSP allows `'unsafe-eval' 'unsafe-inline'` for scripts (line 47) — needed for Next dev / inline runtime, but this means a real XSS sink would not be blocked.
  - `connect-src` allows `*.neon.tech`, `*.vercel.app`, `*.sentry.io`, S3, CloudFront. Missing: WhatsApp Graph API (`graph.facebook.com`), Resend, Groq, Anthropic, OpenWeatherMap, Plaid — these are all server-side calls so not strictly needed.
- **No `output` set** (good — defaults to standard Next on Vercel). No `experimental.*`. No `reactStrictMode` set explicitly (defaults to `true` since Next 13.4).
- **No instrumentation hook flag needed** — `instrumentation.ts` is auto-detected in Next 16.

## 8. `simple-git-hooks` / `lint-staged` — `package.json`

- `simple-git-hooks` config at lines 25-27: `pre-commit: pnpm lint-staged`.
- `lint-staged` config at lines 28-33: `*.{ts,tsx}` runs `eslint --fix` + `bash -c 'pnpm type-check'`.
- `prepare: simple-git-hooks` script at line 23.
- ✓ Hooks fire on commit. **Issue:** `pnpm type-check` checks the **entire project** on every commit (because `tsc --noEmit` is project-wide), not the staged files. That's correct safety-wise but slow — acceptable.

## 9. Stale Turbopack cache — QA report Bug #1

- `docs/qa-report-2026-04-25.md:21-56` documents the Hogwarts brand leak via stale `.next/dev` cache.
- Verified `.next/` directory still exists at `/Users/abdout/mazin/.next/` (`.gitignore:18-19` ignores it, but the local cache is still on disk).
- No CI step or build hook to invalidate. The fix is operator-side (`rm -rf .next .turbo`).
- No automatic cache-bust signal in `next.config.ts`.

## 10. Staging vs prod parity

- `docs/deployment.md:5-9`: lists prod (`mazin.sd` / `main`) and staging (`staging.mazin.sd` / `staging`).
- Env table at `deployment.md:21-41` is **incomplete** vs `env.ts`:
  - Lists only `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Sentry, `CRON_SECRET`, Google/GitHub OAuth, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`.
  - **Missing from docs:** `AUTH_SECRET` (the canonical one), `AUTH_URL`, `AUTH_TRUST_HOST`, `AUTH_JWT_VERIFY`, AWS S3 + CloudFront entire group, WhatsApp pair, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, Plaid trio, `EMAIL_FROM`, `RESEND_FROM_EMAIL`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `GITHUB_REPO`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SCHEMATIC_*`, Facebook OAuth pair.
  - Wrong key name: `OPENWEATHER_API_KEY` → should be `OPENWEATHERMAP_API_KEY`.
- Cron table at `deployment.md:132-138` lists only `/api/cron/reminders`. `/api/cron/demurrage` is **missing from docs**.

## 11. Robots.txt / sitemap

- `src/app/robots.ts` — exists (16 lines). Allows `/`, disallows `/api/`, `/dashboard/`, `/admin/`. Sitemap link.
- `src/app/sitemap.ts` — exists (22 lines). Iterates `i18n.locales` × `["", "/login", "/register"]`. **Marketing routes are missing** (`/about`, `/services`, `/track`, `/contact`, etc. — these exist as routes but are not in the sitemap).
- ✓ Files exist. P1 — sitemap incomplete.

## 12. Manifest — **MISSING**

- No `src/app/manifest.ts`, no `src/app/manifest.json`, no `public/manifest.webmanifest`.
- QA report `qa-report-2026-04-25.md:60-87` flags this and provides the exact `manifest.ts` to add.
- `next.config.ts` references `siteConfig` indirectly via metadata in layout; the QA report confirms a stale build is currently serving a Hogwarts manifest from `.next/dev`.
- Also no `public/icon-192.png` / `icon-512.png` — manifest fix needs these created too.

## 13. Instrumentation — `src/instrumentation.ts`

- 16 lines. Imports `sentry.server.config` for `nodejs` runtime (line 8), `sentry.edge.config` for `edge` runtime (line 11).
- Exports `onRequestError = Sentry.captureRequestError` (line 15) — Next 16's per-request error hook is wired.
- **Does NOT import `sentry.client.config`** — that's expected; Next bundles client config separately via the SDK's webpack plugin.
- ✓ Correct.

---

## Findings — P0 / P1 / P2

### P0 (deployment blockers / brand-leak)

1. **Manifest missing.** No `src/app/manifest.ts` and no `public/icon-{192,512}.png`. Stale `.next` is currently serving a Hogwarts manifest. *Fix:* create `src/app/manifest.ts` per QA report; add `public/icon-192.png` + `public/icon-512.png`.

2. **CI does not run `prisma migrate deploy`.** `.github/workflows/ci.yml:55-120` only does `db:push` on the throwaway Postgres service for E2E. Production migrations have no automated deploy path. *Fix:* either (a) add a `migrate-deploy` job that runs against staging on `staging` push and prod on `main` push, gated on `DATABASE_URL` secret, or (b) wire it into a Vercel build step (`build: prisma migrate deploy && prisma generate && next build`).

3. **`NEXTAUTH_SECRET` vs `AUTH_SECRET` doc-vs-code drift.** `docs/deployment.md:23-26` tells operators to set `NEXTAUTH_SECRET`. `env.ts:36-37` requires `AUTH_SECRET`. A new operator following the doc deploys with `NEXTAUTH_SECRET` only → build fails in prod with "AUTH_SECRET is required in production". *Fix:* update `docs/deployment.md` to list `AUTH_SECRET` (with `NEXTAUTH_SECRET` as a deprecated alias).

### P1 (production-quality risks)

4. **`SENTRY_AUTH_TOKEN` not exposed to CI build env** (`.github/workflows/ci.yml:51-53`). Source-map upload is silently disabled in CI. *Fix:* add `SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}` to the `env:` block at line 51.

5. **CI has a fallback `'ci-test-secret'` for `AUTH_SECRET`** (`ci.yml:53`). Hides missing-secret misconfigurations. *Fix:* drop the fallback. Make CI fail loudly when the org secret isn't wired.

6. **Cron functions have no `maxDuration`** in `vercel.json`. Demurrage scans every undelivered shipment — could exceed 10 s on Hobby plan. *Fix:* add `"functions": { "src/app/api/cron/**/route.ts": { "maxDuration": 60 } }` to `vercel.json` and confirm Pro plan.

7. **`RESEND_FROM_EMAIL` referenced but not validated.** `src/lib/resend.ts:12` reads it; not in `env.ts`. *Fix:* add `RESEND_FROM_EMAIL: z.string().optional()` to `env.ts` and `rawEnv`.

8. **`OPENWEATHER_API_KEY` typo in `docs/deployment.md:41`.** Code uses `OPENWEATHERMAP_API_KEY`. *Fix:* rename to `OPENWEATHERMAP_API_KEY` in docs.

9. **`docs/deployment.md` env table is ~80% incomplete** (see section 10). *Fix:* regenerate the doc table from `.env.example` so the two stay in sync.

10. **`/api/cron/demurrage` is missing from `docs/deployment.md:132-138` cron table.** *Fix:* add the row.

11. **Sentry `tracePropagationTargets` not set** anywhere. *Fix:* add `tracePropagationTargets: [/^\//, /^https:\/\/.*\.mazin\.sd/]` to `sentry.server.config.ts` and `sentry.client.config.ts`.

12. **Server-side `SENTRY_DSN` ignored.** `sentry.server.config.ts:4` and `sentry.edge.config.ts:4` only read `NEXT_PUBLIC_SENTRY_DSN`. *Fix:* `dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN`.

13. **No `pnpm audit` / Dependabot in CI.** *Fix:* add a daily `pnpm audit --prod` workflow or enable Dependabot.

14. **No post-deploy smoke test.** *Fix:* GitHub Action with `curl -fsS https://mazin.sd/api/health` after deploy webhook, or a Vercel deployment-hook integration.

### P2 (polish)

15. **Sitemap incomplete** (`src/app/sitemap.ts:6`). Lists `["", "/login", "/register"]` only — marketing routes (`/about`, `/services`, `/track`, `/contact`) are accessible but not advertised.

16. **CI doesn't pin `regions` in `vercel.json`.** Defaults to `iad1`.

17. **`vercel.json` `public: true`** (line 4) disables Vercel deployment-protection on previews.

18. **CSP allows `unsafe-eval` and `unsafe-inline` for scripts** (`next.config.ts:47`).

19. **Stale `.next/dev` cache** (QA Bug #1, still on disk) — operator action only; consider documenting `pnpm clean` script that runs `rm -rf .next .turbo node_modules/.cache`.

20. **`lint-staged` runs project-wide `tsc --noEmit`** (`package.json:31`) on every commit — slow.
