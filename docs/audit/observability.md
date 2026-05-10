# Mazin Observability & Logging Audit

## Executive snapshot

The foundation is solid: Sentry is wired through `instrumentation.ts`, there's a structured `logger` that funnels into Sentry, `withJobLock` + `JobRun` give crons real idempotency, and `logAudit` is invoked from ~16 server-action files. The gaps are: invoice/payment write paths in `src/actions/` skip the audit log entirely, error boundaries leak raw `error.message` to the UI, no source-map upload tokens are configured, no 429 alerting, no slow-query observability, and no `process.on('unhandledRejection')` guard.

---

## P0 — Production-blocking

### P0-1. Invoice and shipment-payment writes have ZERO audit trail

**Files:**
- `src/actions/invoice.ts:1-200+` — `createInvoice`, `updateInvoiceStatus` (line 151), `deleteInvoice` (line 177), `updateInvoice`, `markStagePayment`, `cancelInvoice`, `sendInvoice` — **none** call `logAudit`. (`grep logAudit src/actions/invoice.ts` returns empty.)
- `src/actions/shipment-payment.ts:65-268` — `createShipmentPayment`, `updateShipmentPayment` (line 185), `markPaymentConfirmed` (line 226), `deleteShipmentPayment` (line 257) — only `recordShipmentEvent` (a timeline-event for the UI), never `logAudit`. The timeline event is **not** an immutable audit log; it's user-facing data.

This is a financial-records compliance fail. The platform-level invoice helper at `src/components/platform/invoice/stage-invoice.ts:112` does write audit, so the feature exists — but the primary invoice CRUD path bypasses it.

**Fix:** Add `logAudit({ action: "RECORD_CREATE|UPDATE|DELETE", actor: ctx, resource: "invoice|payment", resourceId: id, metadata: {...} })` after every successful mutation in `src/actions/invoice.ts` and `src/actions/shipment-payment.ts`. Mirror what `src/components/platform/finance/banking/payment-transfer/actions.ts:117` already does for transfers.

### P0-2. Error boundaries echo raw `error.message` to the user

**File:** `src/app/[lang]/(platform)/finance/banking/error.tsx:55`
```tsx
{error.message || translations.defaultMessage}
```
Combined with server-action throws like `throw new Error("Cannot edit a paid or cancelled invoice")` (`src/actions/invoice.ts:232`), a Prisma error such as `P2002 Unique constraint failed on the fields: (...)` would render verbatim to the user. Database column names, constraint names, and SQL fragments leaking into the UI is a P0 information-disclosure bug.

**Fix:** Replace `error.message` with `translations.defaultMessage` and surface only `error.digest` for support. Apply the same in any other custom `error.tsx` that interpolates `error.message`.

### P0-3. Sentry source-map upload is unconfigured at the token level

**File:** `next.config.ts:63-70`
```ts
withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  ...
})
```
There's no `authToken` (or it's expected from `SENTRY_AUTH_TOKEN` env). `widenClientFileUpload: true` is set, but without a token in CI the upload silently no-ops. Production stack traces will be minified and unactionable.

**Fix:** Add `authToken: process.env.SENTRY_AUTH_TOKEN` explicitly so missing tokens fail loudly during build. Verify `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` are set in Vercel project envs.

### P0-4. In-memory rate limiter on a serverless deployment

**Files:** `src/lib/rate-limit.ts:27` (`const buckets = new Map`), `src/middleware.ts:94`, `src/components/chatbot/actions.ts:27`, `src/components/platform/marketplace/actions.ts:93,543`.

Vercel serverless functions don't share a process — every cold start gets a fresh `Map`, and the budget for a single attacker scales with concurrency. The author flags this in the file's own header comment. On top of that, **429 events are not logged or alerted**: `middleware.ts:96-100` silently returns the JSON without `log.warn` or `Sentry.captureMessage`.

**Fix:**
1. Swap to `@upstash/ratelimit` + Redis (already noted as TODO in `rate-limit.ts:7`).
2. In `middleware.ts:95`, before returning the 429, call `log.warn("Rate limit hit", { route: pathname, ip })` so Sentry breadcrumbs and (with a Sentry alert rule) Slack/email get notified on spikes.

---

## P1 — Important, fix this sprint

### P1-1. Sentry config is the bare minimum

**Files:** `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`
- No `release`, no `environment` tag — production and preview deploys mix in the same Sentry project.
- No `beforeSend` hook to scrub PII (emails, tokens, request bodies).
- No `integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })]` — so on-error replays will capture user PII, invoice data, and bank account numbers in cleartext.
- No `profilesSampleRate` even though `tracesSampleRate` is set.
- No `tracePropagationTargets` — server↔client traces won't connect.

**Fix:** In all three configs, add `environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV`, `release: process.env.VERCEL_GIT_COMMIT_SHA`, and a `beforeSend` that drops `event.request.cookies`, `event.request.data.password`, and any `metadata.password*`. In the client config, explicitly construct `Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })`.

### P1-2. `global-error.tsx` swallows error context

**File:** `src/app/global-error.tsx:15-17`
```tsx
useEffect(() => { Sentry.captureException(error) }, [error])
```
The captured exception has no breadcrumb context (because this fires after the React tree unmounted) and no user context. Add `Sentry.captureException(error, { tags: { boundary: "global" }, extra: { digest: error.digest } })`. Same applies to `src/components/error-boundary.tsx:21`.

### P1-3. Health endpoint is too thin for a real probe

**File:** `src/app/api/health/route.ts:1-31`
- No auth gate (anyone on the internet can probe DB latency), but more importantly no checks on Redis/Sentry/cron freshness or last successful `JobRun`.
- Returns `503` only on DB error — won't catch the case where the demurrage cron hasn't run for 3 days.

**Fix:** Add a `JobRun.findFirst({ where: { status: "SUCCESS" }, orderBy: { startedAt: "desc" } })` lookup; flag `degraded` if older than `26h`. Optionally split `/api/health/live` (DB only) and `/api/health/ready` (full).

### P1-4. No `unhandledRejection` / `uncaughtException` handler

**File:** `src/instrumentation.ts:1-15`. Sentry's Node SDK installs handlers automatically when initialized, but there's no defensive `process.on('unhandledRejection', err => Sentry.captureException(err))` and no `register()` work besides the Sentry import.

**Fix:** Inside `register()` after the Sentry import, attach explicit handlers:
```ts
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)))
})
process.on('uncaughtException', (err) => Sentry.captureException(err))
```

### P1-5. No slow-query observability

**File:** `src/lib/db.ts:23` — `log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]`. Prisma supports `{ emit: 'event', level: 'query' }` for query timing, currently unused. There's also no Neon `pg_stat_statements` reading or any `query > N ms → log.warn` interceptor. Slow N+1 queries in production are completely invisible.

**Fix:** Convert the `log` config to event mode and add a listener that emits `log.warn("slow query", { duration, query })` for any query > 500 ms. A Sentry breadcrumb would tie those into related exceptions.

### P1-6. PII in info-level breadcrumbs

**Files:**
- `src/components/platform/settings/team/actions.ts:68` — `log.info("staff invite issued", { email: validated.email, role: validated.role })`
- `src/components/platform/settings/team/actions.ts:169` — `log.info("staff invite accepted", { email: invite.email })`

These are not catastrophic but they propagate to Sentry as breadcrumb context (`logger.ts:19-24`) which then ends up in every later exception captured for that request. Combined with no `beforeSend` scrubber (P1-1), Sentry gets a continuous low-grade PII feed.

**Fix:** Hash/truncate email in the breadcrumb (`email: validated.email.replace(/(.{2}).+@/, '$1***@')`).

### P1-7. Database leakage via raw `throw new Error`

**Files:** Sampled examples — `src/components/platform/shipments/actions.ts:172,174,211`, `src/components/platform/customs/actions.ts:32,37`, `src/components/platform/team/actions.ts:24,114,122`, `src/actions/invoice.ts:58,126,142,154,161,180,187,217,227,232,318`, `src/actions/shipment-payment.ts:69,76,121,126,141,190,195,228,233,259,264`.

The strings themselves are mostly safe ("Unauthorized", "Shipment not found"), **but** Prisma errors (`P2002`, foreign-key, transaction failures) thrown unchecked will bubble identically through Next.js's error pipeline and reach `error.tsx` — see P0-2. There's no central `try/catch → safe-error-code` wrapper for server actions; only `settings/profile/actions.ts:84` and `settings/organization/actions.ts:83` follow the safe `ActionResult` pattern.

**Fix:** Wrap every public server action in a try/catch that returns `{ ok: false, error: "OPERATION_FAILED", code: "<stable code>" }` and logs the original via `log.error`. Do NOT propagate `error.message`. The `ActionResult<T>` type from `src/components/platform/settings/types.ts` is the right pattern to standardize on.

---

## P2 — Hardening

### P2-1. Cron monitor schedule is duplicated literal

**Files:** `src/app/api/cron/reminders/route.ts:28` (`'0 8 * * *'`) and `vercel.json:7` (`'0 8 * * *'`). If one drifts, Sentry will alert as missed-checkin even though the job ran. Centralize the schedule string.

### P2-2. Cron `withJobLock` runs *after* `Sentry.captureCheckIn(in_progress)`

**File:** `src/app/api/cron/reminders/route.ts:53-66`. The check-in is opened on every duplicate firing, even when the lock returns `skipped`. This is harmless but gives misleading "ran twice" counts in Sentry Crons UI.

### P2-3. `task-detail-client.tsx` calls `log.error` from a `'use client'` boundary

**File:** `src/app/[lang]/(platform)/task/[id]/task-detail-client.tsx:123,152`. The shared `logger` imports `@sentry/nextjs` Node bits via `forModule`. It works (Next.js polyfills), but it pulls Sentry into the client bundle — fine when the client SDK is desired, but verify the bundle isn't doubly-importing server code.

### P2-4. Task reminder per-loop swallows errors silently

**File:** `src/lib/jobs/task-reminders.ts:88-97, 160-168`. Failed sends are pushed into the result array but never `log.error`'d, so a 100% WhatsApp outage would return `notificationSent: false` for every row and the cron summary line at line 626 would still show success. Add `log.error("reminder send failed", err, { taskId })` inside the `catch`.

### P2-5. `Sentry.captureCheckIn` / `JobRun` overlap

**File:** `src/lib/jobs/lock.ts` writes to `JobRun` and `src/app/api/cron/*/route.ts` writes to Sentry Crons. Two sources of truth for "did the cron run." Either is fine; pick one for paging and the other for forensics.

### P2-6. No tracing for server actions

Server actions invoked via React Server Actions don't get an automatic Sentry transaction unless wrapped in `Sentry.withServerActionInstrumentation`. None of the audited actions wrap themselves. Add this in a small helper to get per-action latency in Sentry Performance.

### P2-7. `resend.ts:7` uses `log.warn` for missing API key

**File:** `src/lib/resend.ts:7`. Reasonable, but production should fail-fast on env validation rather than discover at first email-send. Pull `RESEND_API_KEY` into `src/lib/env.ts` validation.

---

## Coverage summary table

| Concern | Status | Evidence |
|---|---|---|
| Sentry server/client/edge configs | Present, minimal | `sentry.{server,client,edge}.config.ts:3-9` — no env, release, scrubbing, integrations |
| Source-map upload | Plumbed, token unverified | `next.config.ts:63-70` — no explicit `authToken` |
| `global-error.tsx` | Present, captures to Sentry | `src/app/global-error.tsx:16` |
| `[lang]/error.tsx` | Present | `src/app/[lang]/error.tsx:9` via `PageErrorBoundary` |
| Logger | Present, structured, → Sentry | `src/lib/logger.ts` |
| `logAudit` | Inconsistent — finance/banking/shipment/customs/team yes; **invoice + shipment-payment NO** | `src/lib/audit.ts`; missing in `src/actions/invoice.ts`, `src/actions/shipment-payment.ts` |
| Server-action error hygiene | Mixed — settings module uses `ActionResult`, others bare `throw` | `src/components/platform/settings/profile/actions.ts:84` vs `src/actions/invoice.ts:58+` |
| Health endpoint | Present, DB-only, public | `src/app/api/health/route.ts` |
| 429 alerting | None | `src/middleware.ts:96-100` |
| `unhandledRejection` handler | Implicit (Sentry SDK) | `src/instrumentation.ts:6-15` |
| Cron observability | Strong — Sentry check-ins + `JobRun` idempotency | `src/app/api/cron/{reminders,demurrage}/route.ts`, `src/lib/jobs/lock.ts` |
| PII in logs | Minor — emails in info logs, no scrubber | `src/components/platform/settings/team/actions.ts:68,169` |
| Slow query logging | Absent | `src/lib/db.ts:23` |
