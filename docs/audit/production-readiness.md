# Mazin — Production Readiness Trace

**Audit date:** 2026-05-08 · **Scope:** every file in `/Users/abdout/mazin/src` and `prisma/`
**Method:** 9 parallel deep-dives (security, database, tests, deploy/CI, payments, performance, storage, i18n, observability), every claim verified against actual source code, file:line cited.

---

## 🟥 Headline

**Not shippable.** The codebase is more mature than a beta but **less mature than the docs claim**. `_resume.md:73-94` says "Phase 1 — Done" — but that refers to the *operational* Phase 1 (ACD validators, demurrage cron, IM Form expiry alerts), **not** the security/data-integrity Phase 1 in `docs/production-readiness-epics.md`. Of the 6 epics that doc marks as Phase 1 ship-blockers (rate-limit, schema migrations, CSP/session hardening, accounting, notification reliability, observability/audit), **0 are complete**. The team is at risk of deploying believing they're closer to GA than reality supports.

**Three present-tense facts that compound the urgency:**

1. **ACD became mandatory January 1, 2026.** Today is 4+ months past the deadline. Epic 7 is unimplemented; the schema has `AdvanceCargoDeclaration` but `validatedBy` is a raw string, no 72h pre-loading alert, no T-5d B/L cross-validation. Every shipment without ACN compliance risks demurrage + cargo seizure.
2. **README claims "multi-tenant SaaS" but the schema has zero `tenantId`/`organizationId` fields on any of 67 models.** It is single-tenant per-user. A second customer cannot be onboarded without polluting the first's data.
3. **The QA report from 2026-04-25 listed 4 P0 blockers** (Hogwarts brand leak, missing manifest, marketing routes redirect, `/track` not whitelisted). Two of the four are still unfixed in source 13 days later.

---

## 📐 Reconciliation: docs vs reality

| Doc claim | Source | Actual code state | Verdict |
|---|---|---|---|
| "Phase 1 & 2 Complete — OCR remains" | `AUTOMATION_GAP_ANALYSIS.md:6` | OCR exists (`src/lib/services/ocr/index.ts:275`) but **has zero UI consumers**; receipt upload UI calls a hardcoded stub (`receipt/actions.ts:66`) | Misleading |
| "1135 tests green" | `_resume.md:3` | ~1003 vitest cases + 42 Playwright; **all 1003 use a fully-mocked Prisma client** (`__tests__/setup.ts:38-167`); CI E2E job doesn't run `db:seed` so the 42 Playwright tests likely fail in CI | Number accurate, signal misleading |
| "Status calls → Auto-notifications COMPLETE" | `AUTOMATION_GAP_ANALYSIS.md:14` | Stage advance does fire `notifyShipmentMilestone` (`tracking.ts:498-508`) — but **EMAIL channel is a no-op stub** (`notification/index.ts:115`), inbound webhook missing, errors swallowed (`tracking.ts:49 .catch(() => {})`) | Half true |
| "11.4 Daily cron already exists ✅" | `production-readiness-epics.md:572` | Cron exists, but iterates **`Shipment` not `Container`**, fires "overdue" only once at day 0 (exact equality `!== 0` at `cron/demurrage/route.ts:97`), then never re-alerts | Half true |
| "Story 0.1 paused waiting for AWS" | `_resume.md:11` | Storage helpers complete & tested; **but only 1 of 7 upload kinds is wired**, and that one (`uploadShipmentDocument`) has no UI calling it. The actual receipt-upload UI bypasses storage entirely. | "Code written, not wired" — 70% complete |
| "Phase 1 — Done (17 stories)" | `_resume.md:73` | Operational stories shipped; **Epics 1, 2, 3, 4, 5, 6 of `production-readiness-epics.md` (security/data Phase 1) are 0% complete** | Two different "Phase 1"s — clarify |

---

## 🔴 P0 — Ship blockers

### Authentication & Authorization

| # | Finding | Cite | Fix |
|---|---|---|---|
| 1 | OAuth Google/Facebook auto-grant `CLERK` staff role + auto-verify email | `src/auth.config.ts:28, 58` | Default to `COMMUNITY/VIEWER`; staff promotion only via invite |
| 2 | Middleware allows cookie-only "lax" auth — any cookie value passes | `src/middleware.ts:47-73` | Remove `lax` mode in production; gate behind `NODE_ENV !== 'production'` |
| 3 | `getUpcomingData(role: UserRole)` accepts role from client | `src/components/platform/dashboard/actions.ts:100` | Resolve role server-side from `session.user.role` |
| 4 | Payroll mutations lack any role check | `src/components/platform/finance/payroll/actions.ts:163, 221, 398` | Add `requireCan('manage','payroll')` to every action |
| 5 | Bank account create/update/delete lack role check | `src/components/platform/finance/accounts/actions.ts:126, 187, 256` | Add `requireCan('manage','accounts')` |
| 6 | `encryptId/decryptId` is `btoa/atob` — Base64 masquerading as encryption | `src/components/platform/finance/banking/lib/utils.ts:145-151` | Rename to `encodeId`/`decodeId` or replace with HMAC-signed token |
| 7 | No `failedLoginCount`/`lockedUntil` on User → no brute-force lockout | `prisma/models/auth.prisma:16-92` | Add columns + middleware in `login/action.ts` |

### Rate limiting & Abuse

| # | Finding | Cite | Fix |
|---|---|---|---|
| 8 | Rate limiter is in-memory `Map`, evaporates on every cold start | `src/lib/rate-limit.ts:27` | Swap to `@upstash/ratelimit` + Redis (one helper rewrite fixes #8-11) |
| 9 | Public tracking endpoint has zero rate limit — fully scrape-able | `src/actions/tracking.ts:61` | Wrap in `rateLimit('public-track', ip, 30, 5*60_000)` |
| 10 | Login/register/reset have only one IP-bucket, no per-email | `src/middleware.ts:92-101`, `auth/{login,join,reset}/action.ts` | Add per-email bucket: 5/15min/email + 20/15min/IP |
| 11 | Zero CAPTCHA, zero honeypot — register/reset/vendor-signup unprotected | `src/components/auth/{join,reset}/form.tsx`, `marketplace/actions.ts:91` | Cloudflare Turnstile + hidden honeypot field |

### Security headers

| # | Finding | Cite | Fix |
|---|---|---|---|
| 12 | CSP includes `'unsafe-inline' 'unsafe-eval'` for scripts — XSS protection nullified | `next.config.ts:47` | Migrate to nonce-based CSP; refactor inline scripts |

### Database & data integrity

| # | Finding | Cite | Fix |
|---|---|---|---|
| 13 | Only 1 migration covering 8 tables; schema has 67 models — **88% of schema has no migration** | `prisma/migrations/20251226074540_add_auth_schema/`, `package.json:11` `db:push` | `prisma migrate diff --from-empty` to generate baseline; commit; `migrate resolve --applied` on prod |
| 14 | Raw-string FKs everywhere — no referential integrity | `audit.prisma:24`, `invite.prisma:19,22`, `customs.prisma:26,96`, `marketplace.prisma:42`, `finance.prisma:533, 535, 761, 1121, 380-384` | Convert to `@relation`, regenerate types |
| 15 | `Project.team String[]` and `Task.assignedTo String[]` — no join, no FK, can't enforce | `prisma/models/project.prisma:20`, `task.prisma:18` | Create `ProjectMember`, `TaskAssignee` join tables |
| 16 | `Transaction.{invoiceId,payrollId,shipmentId,clientId}` — no FK AND no index | `prisma/models/finance.prisma:380-384` | Add `@relation` + `@@index` |
| 17 | README + marketing claim "multi-tenant SaaS" but **zero `tenantId`/`organizationId` on any model** | All 67 models in `prisma/models/`; `INTEGRATION_COMPLETE.md` is stale Hogwarts copy-paste | Either fix marketing copy to "single-tenant" OR introduce `Tenant` model + FK every business row |

### Notifications & Payments

| # | Finding | Cite | Fix |
|---|---|---|---|
| 18 | Invoice number generation is racy: count-then-insert, no atomic sequence | `src/actions/invoice.ts:72, 531, 723` | `InvoiceSequence` table per (userId, year) with `INSERT ... RETURNING`; or retry on P2002 |
| 19 | Public PDF link is auth-gated → WhatsApp share to client returns 401 | `src/app/api/invoice/[id]/pdf/route.ts:30`, share at `actions/invoice.ts:1001` | Add signed-token public route `/api/invoice/[id]/pdf?t=...` (14d TTL) |
| 20 | No public payment link `/[lang]/pay/[token]` — does not exist | (no file) | Create `PaymentToken` model + signed token route |
| 21 | Inbound WhatsApp webhook missing — Story 0.2 not done despite "Phase 1 Done" claim | (no file `app/api/whatsapp/webhook/route.ts`) | Create route with verify_token GET + signed POST → update WhatsAppMessage status |
| 22 | EMAIL channel is a no-op stub; reminder cron requests EMAIL and silently drops | `src/lib/services/notification/index.ts:115-118`, `task-reminders.ts:537` | Wire Resend with `NotificationType → email template` map |
| 23 | No payment gateway wired (Stripe/Tap/Bankak/Mpesa) | (no files) | If production accepts online payment, wire at minimum one provider with idempotent webhook |

### Storage / Documents / OCR

| # | Finding | Cite | Fix |
|---|---|---|---|
| 24 | Receipt upload UI is hardcoded stub — every call returns `success: false` | `src/components/platform/finance/receipt/actions.ts:66-74` | Replace stub body with `uploadFile(file, { kind: "receipt" })` |
| 25 | Project document upload UI doesn't exist — entire BL/CI/PL workflow nonexistent end-to-end | `src/app/[lang]/(platform)/project/[id]/docs/page.tsx:1-330` (read-only) | Add per-row upload button POSTing to `uploadShipmentDocument(formData)` |
| 26 | No virus scan, no magic-byte MIME check — server trusts client `file.type` | `src/lib/storage/upload.ts:67` | Add `file-type` package; sniff first 4096 bytes; reject mismatch |
| 27 | "Private" files are not actually private — falls back to **unsigned** URLs | `src/lib/storage/cloudfront.ts:66-78`, `upload.ts:110-111` | Add `/api/files/[id]/route.ts` proxy that re-auths and 302s to signed URL |
| 28 | Arabic font in PDFs broken — only Latin Rubik registered, no Cairo/Tajawal | `src/components/platform/invoice/{invoice,clearance-invoice,statement}-pdf.tsx:16-29` | Register Cairo or Noto Naskh Arabic; bundle TTF in `/public/fonts` |

### Observability

| # | Finding | Cite | Fix |
|---|---|---|---|
| 29 | Invoice and shipment-payment writes have **zero audit trail** | `src/actions/invoice.ts` (no `logAudit` calls), `src/actions/shipment-payment.ts:65-268` | Add `logAudit({...})` after every successful mutation |
| 30 | Error boundaries echo raw `error.message` — Prisma error string leaks to user | `src/app/[lang]/(platform)/finance/banking/error.tsx:55` | Replace with `translations.defaultMessage`; show only `error.digest` |

### Brand / i18n / Marketing (carry-over from QA report)

| # | Finding | Cite | Fix |
|---|---|---|---|
| 31 | "Hogwarts" still in 17 source files (JSDoc comments + 1 markdown) | 11 files in `src/components/platform/finance/receipt/*`, `dashboard/*`, `icons/types.ts`, `lib/storage/*`, `lib/jobs/task-reminders.ts:473`, `INTEGRATION_COMPLETE.md` | One-shot `sed` rename pass |
| 32 | `manifest.webmanifest` not in source — stale `.next` serves Hogwarts manifest | (no file `src/app/manifest.ts`); `qa-report-2026-04-25.md:60-87` has the spec | Create `src/app/manifest.ts` + `public/icon-{192,512}.png` |
| 33 | `/track` index not in `publicRoutes` — redirects to login | `src/routes.ts:35-40` (only prefix `/track/` listed) | Add `/track`, `/en/track`, `/ar/track` to `publicRoutes` |

### Deployment

| # | Finding | Cite | Fix |
|---|---|---|---|
| 34 | CI does not run `prisma migrate deploy` — production migrations have no automated path | `.github/workflows/ci.yml:55-120` (only `db:push` on throwaway PG) | Add migrate-deploy job gated on `staging`/`main` push |
| 35 | `docs/deployment.md` tells operators to set `NEXTAUTH_SECRET`; code requires `AUTH_SECRET` — new prod deploy from doc fails build | `deployment.md:23-26` vs `env.ts:36-37` | Update doc to canonical `AUTH_SECRET`; mention `NEXTAUTH_SECRET` as deprecated alias |

### Tests

| # | Finding | Cite | Fix |
|---|---|---|---|
| 36 | CI E2E does not run `pnpm db:seed` — login fixtures `mazin@abdout.org` don't exist; 42 Playwright tests likely fail/skip silently in CI | `.github/workflows/ci.yml:105-112` | Add `pnpm db:seed` step before `pnpm test:e2e` |
| 37 | Cron route auth (`CRON_SECRET`) has zero test coverage — token-leak / no-auth deploy undetectable | `src/app/api/cron/{demurrage,reminders}/route.ts` (no `verifySecret` test) | Add unit test exercising `verifySecret(request)` |
| 38 | Real "create shipment → advance → invoice → upload → tracking" happy-path E2E missing — all `tests/e2e/platform/*` are page-renders | `tests/e2e/platform/{shipments,invoice}.spec.ts` | Add at least one full workflow E2E |

### Regulatory (post-deadline)

| # | Finding | Cite | Fix |
|---|---|---|---|
| 39 | **ACD became mandatory Jan 1, 2026** (4+ months ago) — Epic 7 unimplemented: no 72h pre-loading alert, no T-5d B/L cross-validation, no ACN collision detection | `prisma/models/customs.prisma:96` (`validatedBy String?` raw FK), no cron at `/api/cron/acd/*` | Implement Epic 7.1-7.5; treat as P0 schedule risk |

---

## 🟡 P1 — Ship before GA

Grouped tightly. ~50 items; the leveraged ones:

**Auth/session:** session.maxAge unset (defaults to 30d) `src/auth.ts:184`; `trustHost: true` unconditional `src/auth.ts:187`; email-enumeration in `reset/register` success messages; 2FA opt-in only, not enforced for ADMIN/MANAGER; no Origin/Referer enforcement; chatbot rate-limit also `Map`-based at `chatbot/actions.ts:27-28`; Customer/wallet/expenses/budget actions lack role checks.

**PDF & Email:** PDF endpoints have no rate limit and no `maxDuration` (`src/app/api/invoice/[id]/pdf/route.ts`, `statement/[id]/pdf/route.ts`); no row-count cap so a 10K-row statement OOMs the lambda; PDF route has no staff bypass — even admin can't fetch teammate's invoice; Resend module starts even without `RESEND_API_KEY`.

**Notifications:** WhatsApp template names diverge between `whatsapp.ts:16-44` and `templates.ts:147-153` (two sources of truth, both ship); phone validation in WhatsApp not using `isValidSudanPhone` (`whatsapp.ts:63`); `dispatchNotification` calls back into `createNotification` → dual-insert on every external delivery; per-channel failures hidden by overall `SENT` status; demurrage cron fires "overdue" only once at day 0 (`!== 0` exact equality at `cron/demurrage/route.ts:97`); demurrage cron ignores `Container` table; two overlapping invoice-overdue jobs cause double notifications (`task-reminders.ts:602, 606`); `fireStageNotification` swallows errors (`tracking.ts:49`); `ShipmentPayment` conflates client receivables with vendor payouts.

**Database:** No `IdempotencyKey` model — payment recording double-clicks become double payments; no `deletedAt` on any model — hard deletes only; `NotificationPriority` lowercase (`prisma/models/notification.prisma:33-38`) — inconsistent with rest; `AuditLog` has no retention column and no purge cron (data growth bomb); `PrismaNeon` adapter has no `max` pool size (`src/lib/db.ts:18-20`); missing indexes on `Invoice.blNumber/declarationNo`, `Shipment.containerNumber`, `Shipment.demurrageStartDate`; missing compound `@@index([userId, createdAt])` on Shipment/Invoice/Expense.

**Performance:** Finance dashboard ships ~150-200KB of recharts in initial bundle (`finance/dashboard/content.tsx:19-23`); `getClientProfit` is O(N) round-trips × 3 (`actions/profit.ts:120-129`); `compliance-actions.ts:34-156` has 4 sequential `findMany` instead of `Promise.all`; `getProject` uses `include` (kitchen-sink) instead of field-level `select` (`platform/project/actions.ts`); bulk container creates use for-loop instead of `createMany` (`actions/container.ts:107-138, 266`); `pg_trgm GIN` indexes missing for ILIKE searches on Client/Shipment.

**Observability:** Sentry config missing `release`, `environment`, `beforeSend` PII scrubber, replay `maskAllText`; no `tracePropagationTargets`; server-side `SENTRY_DSN` ignored (only reads `NEXT_PUBLIC_SENTRY_DSN`); `SENTRY_AUTH_TOKEN` not exposed to CI build env → source maps not uploaded; no slow-query logger in `src/lib/db.ts:23`; CI fallback `'ci-test-secret'` for `AUTH_SECRET` hides missing-secret misconfig (`ci.yml:53`); cron functions have no `maxDuration` in `vercel.json`; `RESEND_FROM_EMAIL` not in `env.ts`; `OPENWEATHER_API_KEY` doc typo vs code's `OPENWEATHERMAP_API_KEY`; `docs/deployment.md` env table is ~80% incomplete; no `pnpm audit`/Dependabot in CI; no post-deploy smoke test.

**Tests:** Vitest has no `thresholds` block — coverage can silently regress (`vitest.config.ts:13-23`); all unit tests use mocked Prisma — schema drift, FK cascades, `@@unique` collisions untested; multi-tenant isolation unproven (model itself absent); no accessibility tests (zero `axe-core`); no visual regression; `qa@mazin.test` user requested by QA report still not seeded.

**i18n:** Zod messages uniformly hardcoded English (every validation file); customs table headers hardcoded English (`customs/content.tsx:48-53`); settings/team/security/permissions tables hardcoded English; `NEXT_LOCALE` cookie misalignment when user has stale `en` cookie on `/ar` route; `ar-SA` (Saudi) vs `ar-SD` (Sudan) inconsistent across 7+ files — site is for Sudan; `Project.activities Json?` should be `ProjectActivity` model.

---

## 🟢 P2 — Post-launch polish

**Auth:** JWT callback re-fetches User on every request; no `cookies` block in NextAuth config; `sessionsRevokedAt` invariant for "sign out all devices" not implemented.
**Performance:** Move `'use client'` off `marketing/{footer,board,faq,ready-to-build}.tsx`; standardize on one of `framer-motion` vs `motion` (currently both ship); drop `geist` package + `@tabler/icons-react` (zero usages); add `experimental.optimizePackageImports`; missing `loading.tsx` for 11 pages; wrap dashboard sub-panels in `<Suspense>`.
**i18n / RTL:** Logical-property hygiene one file (`template/timeline/timeline.tsx:42, 47, 48`); register Cairo for Arabic UI font.
**Marketing:** Replace Unsplash board photos (`about/page.tsx:146-153`); replace testimonial placeholder; fix broken footer links (careers, helpCenter, blog); fix `contianer.jpg` typo; remove orphan `/service` directory (vs `/services`).
**Observability:** Sentry crons schedule duplicated literal between `route.ts:28` and `vercel.json:7`; `task-detail-client.tsx` calls `log.error` from client boundary (verify bundle); add `Sentry.withServerActionInstrumentation` wrapper for per-action latency.

---

## 🗓️ Suggested 8-week sequence

Order minimizes regressions and unblocks the most P0/P1 items per PR.

| Week | Focus | What ships | Closes |
|---|---|---|---|
| **1** | **Brand + critical-path stop-the-bleed** | Manifest, sed-rename Hogwarts→Mazin, `/track` whitelist, env doc parity, OAuth role downgrade, rate-limiter Upstash swap | P0 #1, #8-11, #31, #32, #33, #35; QA Bugs #1-#4 |
| **2** | **Server-action authz lockdown** | `requireCan` on payroll/accounts/wallet/expenses/budget, fix `getUpcomingData(role)` IDOR, rename `encryptId`, server-action error-hygiene helper | P0 #3-5, #6, #7; P1 customer/wallet/expenses authz |
| **3** | **Database migration baseline + FK conversion** | `migrate diff` baseline, convert raw-string FKs to `@relation`, create `ProjectMember`/`TaskAssignee` join tables, decide single-vs-multi tenant, remove README "multi-tenant" claim until you commit to schema | P0 #13-17 |
| **4** | **Notifications, idempotency, ACD compliance (regulatory)** | Email channel real Resend, inbound WhatsApp webhook, `IdempotencyKey` model, invoice-number sequence atomic, ACD 72h pre-loading + T-5d cross-validation crons | P0 #18, #21, #22, #39; P1 idempotency |
| **5** | **Storage wiring, OCR, PDF Arabic font** | Receipt upload calls `uploadFile`, project doc upload UI, `/api/files/[id]` proxy + signed URLs, Cairo font in PDFs, magic-byte MIME check | P0 #24-28, #19 |
| **6** | **CSP, CAPTCHA, 2FA enforcement, audit log coverage** | Nonce-based CSP, Turnstile on register/reset/vendor signup, 2FA enforced for ADMIN/MANAGER, `logAudit` on invoice + shipment-payment | P0 #12, #29; P1 2FA enforcement |
| **7** | **Tests, CI hardening, observability** | E2E full-workflow happy path, CI seed step, cron-secret tests, axe-core + visual regression, Sentry release/env/scrubber/source-map, slow-query logger, post-deploy smoke | P0 #34, #36-38; P1 tests + observability |
| **8** | **Performance + i18n polish + go-live checklist** | Dynamic-import recharts on finance dashboard, `Promise.all` waterfall pass, Zod bilingual messages, customs table localization, ar-SA→ar-SD normalization, Lighthouse CI gate | P1 perf + i18n |

---

## 🧭 Three highest-leverage one-PR fixes (do these first)

1. **One PR: Upstash Redis rate-limiter** → closes P0 #8, #9, #10, P1 chatbot, P1 PDF rate-limit, P1 429-no-alert. (1-2 days)
2. **One PR: Server-action `requireCan` audit** → adds role checks to payroll/accounts/wallet/expenses/budget; fixes the OAuth role-default regression in same change. (2-3 days)
3. **One PR: Database baseline migration + raw-FK conversion + remove "multi-tenant" claim from README** → unblocks every future schema change AND gives the team an honest tenancy story to plan against. (3-5 days, big diff but mechanical)

These three together flip ~60% of P0 to closed without touching feature code.

---

## 📌 What's NOT broken (worth knowing)

To keep the picture honest:
- **Auth.js v5 wiring is correct.** 2FA flow (when enabled) properly clears `TwoFactorConfirmation`. Email verification gate at `auth.ts:127` is enforced.
- **Cron idempotency via `JobRun` is solid.** `withJobLock` short-circuits double firings; demurrage cron has both job-lock + `Notification.dedupKey`.
- **Stage advance does fire notifications** for the 11 tracking stages (`tracking.ts:498-508`) — just swallows errors.
- **Sentry is plumbed end-to-end** through `instrumentation.ts:8-15` and Next 16's `onRequestError` hook. Just needs config polish.
- **Health endpoint runs `SELECT 1`** and returns 503 on DB-down (`src/app/api/health/route.ts:12-29`).
- **Dictionary parity is perfect** — 2348 = 2348 keys between `ar.json`/`en.json`, zero drift.
- **RTL hygiene is strong** — `getDir`/`isRTL` exist, `dir={dir}` wired widely, only one Tailwind `pl-/text-left` violation.
- **Storage primitives (`src/lib/storage/*`) are production-quality** — `FileRecord` model exists with indexes, SHA-256 dedupe, env-gated S3 client. Just not wired to UI.
- **Real OCR exists.** `extractReceipt`, `extractCommercialInvoice`, `extractBL` use `@ai-sdk/anthropic` Claude vision with Zod-validated output. Just no UI calls them.
- **Multi-file Prisma assembly via `prisma.config.ts:54` is the correct Prisma 7 pattern.**
- **Build pipeline (lint + type-check + test + build)** runs in CI on every PR.
- **Vercel cron infra is configured** for both reminders and demurrage with `CRON_SECRET` fail-closed auth.

Bottom line: **the architecture choices are right, the operational features mostly work, but the platform has a credibility gap between marketing copy and security/data posture.** Six focused weeks of P0 work close the gap; the rest is a steady drumbeat of P1 toward an honest GA.

---

## See also

- [`security.md`](./security.md) — 25 findings (rate-limit, RBAC, JWT, OAuth, CSP)
- [`database.md`](./database.md) — 24 findings (migrations, FK, multi-tenancy, indexes)
- [`tests.md`](./tests.md) — 21 findings (mocked Prisma, no seed in CI, no a11y)
- [`deployment.md`](./deployment.md) — 20 findings (env doc drift, Sentry tokens, cron maxDuration)
- [`notifications-payments.md`](./notifications-payments.md) — 22 findings (invoice race, public PDF 401, no payment gateway)
- [`observability.md`](./observability.md) — 16 findings (audit-log gaps, error.message leak, no slow-query log)
- [`i18n-brand.md`](./i18n-brand.md) — 14 findings (Hogwarts in 17 files, manifest, ar-SA vs ar-SD)
- [`performance.md`](./performance.md) — 28 findings (recharts in initial bundle, getClientProfit O(N×3), include over-fetch)
- [`storage-ocr-pdf.md`](./storage-ocr-pdf.md) — 19 findings (receipt upload stub, "private" not private, broken Arabic PDF font)
