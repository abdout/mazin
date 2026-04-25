# Mazin — Production Readiness Epics & Stories

**Owner:** ABDOUT GROUP (Mazin Mohamed Al-Amin, License 276)
**Audit date:** 2026-04-24
**Target:** Fully production-ready SaaS for Port Sudan customs clearance automation
**Stack:** Next.js 16 · React 19 · Prisma 7 · PostgreSQL (Neon) · NextAuth v5 · Tailwind 4 · shadcn/ui

This document catalogs every gap found in a full-codebase audit and organizes them into epics and user stories that, once delivered, move the platform from *functional beta* to *production-grade multi-tenant SaaS*. Stories are prioritized P0 (blocker), P1 (ship-before-GA), P2 (post-launch polish).

Legend: 🔴 P0 · 🟡 P1 · 🟢 P2 · 🛂 regulatory · 🔐 security · 💰 revenue-impacting

---

## Table of Contents

- [Phase 1 — Production Blockers](#phase-1--production-blockers)
  - [Epic 1: Rate Limiting & Abuse Protection](#epic-1-rate-limiting--abuse-protection-)
  - [Epic 2: Database Schema Consolidation & Migrations](#epic-2-database-schema-consolidation--migrations-)
  - [Epic 3: Security Headers, CSP, and Session Hardening](#epic-3-security-headers-csp-and-session-hardening-)
  - [Epic 4: Accounting Ledger Completion](#epic-4-accounting-ledger-completion--)
  - [Epic 5: Notification Delivery Reliability](#epic-5-notification-delivery-reliability-)
  - [Epic 6: Observability & Audit Coverage](#epic-6-observability--audit-coverage-)
- [Phase 2 — Regulatory & Domain Automation](#phase-2--regulatory--domain-automation)
  - [Epic 7: ACD Automation & Compliance](#epic-7-acd-automation--compliance--)
  - [Epic 8: Duty Calculator & HS Code Database](#epic-8-duty-calculator--hs-code-database--)
  - [Epic 9: IM Form Lifecycle & Bank Forex](#epic-9-im-form-lifecycle--bank-forex--)
  - [Epic 10: SSMO Inspection Workflow](#epic-10-ssmo-inspection-workflow-)
  - [Epic 11: Demurrage & Container Timeline](#epic-11-demurrage--container-timeline-)
  - [Epic 12: Document OCR & Data Extraction](#epic-12-document-ocr--data-extraction-)
  - [Epic 13: ASYCUDA World Integration](#epic-13-asycuda-world-integration-)
  - [Epic 14: Exchange Rate & FX Snapshots](#epic-14-exchange-rate--fx-snapshots-)
- [Phase 3 — Module Completion](#phase-3--module-completion)
  - [Epic 15: Customer (CRM) Module](#epic-15-customer-crm-module-)
  - [Epic 16: Shipments Lifecycle](#epic-16-shipments-lifecycle-)
  - [Epic 17: Invoice & Statement of Account](#epic-17-invoice--statement-of-account-)
  - [Epic 18: Team, Roles, and Staff Invites](#epic-18-team-roles-and-staff-invites-)
  - [Epic 19: Banking & Reconciliation](#epic-19-banking--reconciliation-)
  - [Epic 20: Payroll & Salary](#epic-20-payroll--salary-)
  - [Epic 21: Expenses, Budgets, Fees](#epic-21-expenses-budgets-fees-)
  - [Epic 22: Marketplace for Services](#epic-22-marketplace-for-services-)
  - [Epic 23: Task Management](#epic-23-task-management-)
  - [Epic 24: Project Workspace](#epic-24-project-workspace-)
- [Phase 4 — Platform Quality](#phase-4--platform-quality)
  - [Epic 25: Internationalization Completeness (AR/EN)](#epic-25-internationalization-completeness-aren-)
  - [Epic 26: Accessibility & RTL Polish](#epic-26-accessibility--rtl-polish-)
  - [Epic 27: Mobile Responsiveness](#epic-27-mobile-responsiveness-)
  - [Epic 28: Marketing Site Polish](#epic-28-marketing-site-polish-)
  - [Epic 29: Public Tracking Hardening](#epic-29-public-tracking-hardening-)
  - [Epic 30: Authentication UX & 2FA Enforcement](#epic-30-authentication-ux--2fa-enforcement-)
  - [Epic 31: Testing Coverage](#epic-31-testing-coverage-)
  - [Epic 32: CI/CD Pipeline Hardening](#epic-32-cicd-pipeline-hardening-)
  - [Epic 33: Performance Optimization](#epic-33-performance-optimization-)
  - [Epic 34: Chatbot Production Readiness](#epic-34-chatbot-production-readiness-)
  - [Epic 35: File Upload, Storage, Virus Scanning](#epic-35-file-upload-storage-virus-scanning-)
  - [Epic 36: Billing & Subscriptions (Schematic)](#epic-36-billing--subscriptions-schematic-)
- [Phase 5 — Growth & Scale](#phase-5--growth--scale)
  - [Epic 37: Client Portal (Trader Self-Service)](#epic-37-client-portal-trader-self-service-)
  - [Epic 38: Mobile App & PWA](#epic-38-mobile-app--pwa-)
  - [Epic 39: Reporting, BI, and Analytics](#epic-39-reporting-bi-and-analytics-)
  - [Epic 40: Multi-Tenancy & White-Label](#epic-40-multi-tenancy--white-label-)

---

# Phase 1 — Production Blockers

> These ship before anyone routes production traffic to the app. Each item is a direct risk to data integrity, security, or regulatory compliance.

## Epic 1: Rate Limiting & Abuse Protection 🔴🔐

**Goal** — Replace in-memory rate limiters with a Redis-backed, persistent, serverless-safe implementation; protect every public and auth endpoint.

**Why it matters** — `src/lib/rate-limit.ts:10` explicitly notes the in-memory `Map` does not survive cold starts on Vercel's multi-instance runtime. An attacker iterating from a single IP can brute-force login, scrape tracking numbers, or spam OCR endpoints with zero DB record.

### Stories

- **1.1 — Provision Upstash Redis & swap rate limiter** 🔴
  As an operator, I want a Redis-backed rate limiter so throttle state persists across serverless invocations.
  **Acceptance:**
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` added to `.env.example` and `src/lib/env.ts`.
  - `@upstash/ratelimit` + `@upstash/redis` installed.
  - `src/lib/rate-limit.ts` rewritten to use sliding-window Redis limiter, fallback to in-memory only in dev.
  - Chatbot limiter in `src/components/chatbot/actions.ts:20-25` migrated to the same helper.
  - Unit test simulating 3 invocations verifies the counter persists.

- **1.2 — Rate limit public tracking endpoint** 🔴
  As a platform, I want `/track/[trackingNumber]` throttled so scrapers cannot enumerate all tracking numbers.
  **Acceptance:**
  - `getPublicTracking` in `src/actions/tracking.ts:56` wrapped in IP-based limiter: 30 req / 5 min / IP.
  - Exceeded limit returns HTTP 429 with `Retry-After` header.
  - E2E test verifies 31st request in a minute window is blocked.

- **1.3 — Rate limit auth endpoints per IP + per email** 🔴🔐
  As a user, I want brute-force protection so my account cannot be forced by credential stuffing.
  **Acceptance:**
  - Login: 5 attempts / 15 min / email AND 20 / 15 min / IP.
  - Password reset: 3 / hour / email AND 10 / hour / IP.
  - Registration: 3 / hour / IP.
  - After threshold, exponential backoff response (clearer UX than instant 429).

- **1.4 — Rate limit PDF export routes** 🟡💰
  As a finance admin, I want PDF rendering limited so a malicious or buggy client can't exhaust Vercel function minutes.
  **Acceptance:**
  - `/api/invoice/[id]/pdf` and `/api/statement/[id]/pdf` — 10 renders / 5 min / user.
  - Hard timeout of 8s wrapping `renderToBuffer` (Vercel limit is 10s).
  - Sentry alert when timeout fires.

- **1.5 — CAPTCHA on public signup and reset** 🔴🔐
  As a platform, I want bot protection on public forms so signup floods don't fill the DB.
  **Acceptance:**
  - hCaptcha or Cloudflare Turnstile integrated on `/join` and `/reset` forms.
  - Fallback honeypot field (hidden input) catches naive bots.
  - Verified token required server-side before `register`/`reset` actions proceed.

- **1.6 — Fail-closed on Resend/WhatsApp outage** 🟡
  As an ops engineer, I want the app to mark notifications as FAILED (not lost) during provider outages.
  **Acceptance:**
  - `src/lib/resend.ts` throws if `RESEND_API_KEY` unset at boot, not at send time.
  - Retry queue (see Epic 5) retries failed dispatches with exponential backoff.

---

## Epic 2: Database Schema Consolidation & Migrations 🔴

**Goal** — Move from `prisma db push` workflow to proper `prisma migrate` discipline with a single canonical baseline covering all 126 models.

**Why it matters** — Only 1 migration exists (`20251226074540_add_auth_schema`, covering 11 tables) while the live Neon DB has ~85 tables created by `db push`. Any prod DB restore or environment bootstrap will produce a schema missing 85% of the app. No rollback path.

### Stories

- **2.1 — Generate baseline migration** 🔴
  As a developer, I want a single baseline migration representing the current schema so fresh environments can `migrate deploy`.
  **Acceptance:**
  - Run `prisma migrate diff --from-empty --to-schema-datamodel` and commit as `20260501000000_baseline`.
  - `prisma migrate resolve --applied` applied to staging/prod to mark as already deployed.
  - Document in `docs/database-migrations.md` the one-time baseline procedure.

- **2.2 — CI migration drift check** 🔴
  As a reviewer, I want CI to fail if schema is changed without a migration.
  **Acceptance:**
  - New GitHub Action step runs `prisma migrate diff --from-schema-datamodel --to-schema-datasource`; non-empty diff fails the PR.
  - Action runs on every PR touching `prisma/models/*`.

- **2.3 — Fix `NotificationPriority` enum casing** 🔴
  As a developer, I want the enum to match the rest of the schema's uppercase convention.
  **Acceptance:**
  - `prisma/models/notification.prisma` — `NotificationPriority` values changed from `low/normal/high/urgent` to `LOW/NORMAL/HIGH/URGENT`.
  - Migration renames values in-place (`ALTER TYPE ... RENAME VALUE`).
  - All callers updated.

- **2.4 — Add missing FK constraints** 🔴
  As a data steward, I want referential integrity so orphaned records can't accumulate.
  **Acceptance:** Convert these raw string FKs to proper `@relation`:
  - `AuditLog.actorId` → `User.id` (nullable, SetNull on delete)
  - `StaffInvite.invitedBy/acceptedBy` → `User.id`
  - `CustomsDeclaration.approvedBy/validatedBy` → `User.id`
  - `Vendor.approvedBy` → `User.id`
  - `Expense.approvedBy/rejectedBy/processedBy/closedBy` → `User.id`
  - `Transaction.{invoiceId,payrollId,shipmentId,clientId}` → respective models
  - `Project.team: String[]` → join table `ProjectMember`
  - `Task.assignedTo: String[]` → join table `TaskAssignee`

- **2.5 — Resolve dual-write fields** 🟡
  As a developer, I want a single canonical column per concept so code isn't torn between two sources of truth.
  **Acceptance:**
  - Remove one of each pair, migrating data: `Expense.rejectionReason`/`rejectedReason`, `grossSalary`/`grossAmount`, `netSalary`/`netAmount`.
  - `InvoiceItem.feeType` removed in favor of `feeCategory`.
  - `Task.project String` removed in favor of `projectId`.

- **2.6 — Add soft-delete convention** 🟡
  As a compliance officer, I want deleted records recoverable for 30 days before being purged.
  **Acceptance:**
  - `deletedAt DateTime?` added to `Client`, `Shipment`, `Invoice`, `Project`, `Task`, `Container`, `CustomsDeclaration`, `User`.
  - Every `findMany`/`findFirst` call wrapped with default `WHERE deletedAt IS NULL` via Prisma middleware or repository layer.
  - Admin-only "Trash" view under `/settings/admin/trash`.

- **2.7 — Retention & partitioning for AuditLog** 🟡
  As a DBA, I want audit log growth bounded so it doesn't dominate the DB size.
  **Acceptance:**
  - `retention_days` column added; default 365.
  - Monthly cron purges rows past retention.
  - Consider monthly partition if table > 10M rows.

- **2.8 — Idempotency key model** 🟡💰
  As a finance user, I want payment submissions to be safely retried without double-charging.
  **Acceptance:**
  - `IdempotencyKey` model with `key`, `actionType`, `userId`, `resultJson`, `expiresAt`.
  - All payment-creating server actions accept and check an idempotency key.

- **2.9 — File/upload metadata model** 🟡
  As an admin, I want uploaded files tracked with owner, size, hash, and MIME so we can audit and deduplicate.
  **Acceptance:**
  - `Upload` model: `id`, `userId`, `filename`, `mimeType`, `size`, `sha256`, `storageKey`, `createdAt`, `deletedAt`.
  - Every upload call path goes through a shared `storeUpload()` helper.

---

## Epic 3: Security Headers, CSP, and Session Hardening 🔴🔐

**Goal** — Tighten Content-Security-Policy, configure session rotation, harden middleware JWT verification, and remove debug fallbacks from production paths.

### Stories

- **3.1 — Remove `'unsafe-inline'` and `'unsafe-eval'` from CSP** 🔴🔐
  **Acceptance:**
  - `next.config.ts:46-47` replaced with nonce-based CSP.
  - Inline scripts/styles refactored to use nonces injected per-request in middleware.
  - Report-URI configured to a Sentry Security endpoint.

- **3.2 — JWT session max-age and rotation** 🔴🔐
  **Acceptance:**
  - `src/auth.ts:184` — `session.maxAge` set to 7 days (was defaulting to 30).
  - `updateAge: 24 * 60 * 60` forces rotation on daily activity.
  - Add `lastLoginAt` to `User`; display "last seen" in settings.

- **3.3 — Remove JWT "lax" verify fallback** 🔴🔐
  **Acceptance:**
  - `src/middleware.ts:50, 64` `lax` mode removed or gated behind `NODE_ENV !== 'production'`.
  - Production sessions must decode; failure = redirect to login.

- **3.4 — Conditional `trustHost`** 🟡🔐
  **Acceptance:**
  - `src/auth.ts:187` — `trustHost` gated on `process.env.NODE_ENV !== 'production' || process.env.VERCEL === '1'`.

- **3.5 — Account lockout after repeated failures** 🟡🔐
  **Acceptance:**
  - Add `failedLoginCount`, `lockedUntil` to `User`.
  - 10 failures in 15 min → 30 min lockout.
  - Unlock email sent to user.

- **3.6 — Session-revocation flag** 🟡🔐
  **Acceptance:**
  - `User.sessionsRevokedAt` column.
  - JWT checks `iat >= sessionsRevokedAt` on every request.
  - Admin "Sign out all devices" action available in `/settings/security`.

- **3.7 — CSRF defense in depth** 🟡🔐
  **Acceptance:**
  - Double-submit token or `SameSite=Strict` enforced for all state-changing routes.
  - Document that NextAuth already provides CSRF for auth flows; extend to server actions via `Origin`/`Referer` checks.

- **3.8 — Secrets encryption in `CompanySettings`** 🟡🔐
  **Acceptance:**
  - `whatsappPhoneNumberId`, `whatsappBusinessId`, `whatsappAccessToken`, any future `plaid_secret`, `openai_key` stored encrypted at rest (`AES-256-GCM` with KMS key or env-based key).
  - Wrapper functions `encryptSecret`/`decryptSecret` centralize logic.

---

## Epic 4: Accounting Ledger Completion 🔴💰

**Goal** — Ship a working double-entry bookkeeping engine. Today every accounting action returns `NOT_IMPLEMENTED_ERROR`; the app cannot honestly claim to do accounting.

**Why it matters** — File `src/components/platform/finance/lib/accounting/actions.ts:18-184` has 10 stub actions. Without journaling, reconciliation is impossible, audit trails are incomplete, and finance reports cannot be trusted.

### Stories

- **4.1 — Seed chart of accounts** 🔴💰
  As a finance admin, I want a standard Sudanese COA preloaded so my ledger starts with meaningful buckets.
  **Acceptance:**
  - `ChartOfAccount` seeded with: Assets (1000–1999), Liabilities (2000–2999), Equity (3000–3999), Revenue (4000–4999), Expenses (5000–7999).
  - Sub-accounts per fee category (Customs Duty, Port Fees, Shipping, SSMO, Agent Commission, VAT Receivable, VAT Payable).
  - Seed script: `src/components/platform/finance/lib/accounting/seed-accounts.ts` (currently TODO at `:4-5`).

- **4.2 — Implement `postFeePayment` journal posting** 🔴💰
  As the system, I want fee payments to post debit-cash, credit-fee-revenue automatically.
  **Acceptance:**
  - Debit/credit pair persisted in `JournalEntry` + `JournalLine`.
  - Integrity check: `SUM(debit) = SUM(credit)` per entry.
  - Unit test covers partial/multi-currency cases.

- **4.3 — Implement `postInvoicePayment`, `postSalaryPayment`, `postExpensePayment`, `postWalletTopup`** 🔴💰
  **Acceptance:**
  - Each wired to correct account pairs (e.g., invoice payment: Dr Cash / Cr Accounts Receivable).
  - Reverse entries supported for void/refund.

- **4.4 — Trial balance & general ledger views** 🟡💰
  As a finance admin, I want to view the trial balance so I can verify the books balance.
  **Acceptance:**
  - `/finance/reports/trial-balance` page shows every account with debit/credit totals per period.
  - Export to Excel.
  - `/finance/reports/general-ledger?account=1001&from=...&to=...` shows entries.

- **4.5 — Fiscal year close** 🟡💰
  **Acceptance:**
  - Admin can "close" a fiscal year → no new entries in that period allowed.
  - Closing entries transfer income/expense balances to retained earnings.

- **4.6 — Reversal & correction workflow** 🟡💰
  **Acceptance:**
  - `reverseJournalEntryAction` implemented (currently stub).
  - Reversed entries visible in audit trail; original entry never physically deleted.

- **4.7 — Accounts module not-yet-wired UI** 🟡
  **Acceptance:**
  - The finance layout notes say "only Overview implemented, others stubbed" (`finance/{fees,salary,expenses,...}/layout.tsx:16`). Either ship the sub-pages or remove the menu links until ready.

---

## Epic 5: Notification Delivery Reliability 🔴

**Goal** — Harden notification dispatch with per-channel logs, retry queue, and dead-letter handling.

**Why it matters** — Today WhatsApp messages are logged in `WhatsAppMessage` but email/SMS failures vanish. `src/lib/dispatch-notification.ts:116` fire-and-forgets external delivery; a Resend outage marks rows FAILED and never retries.

### Stories

- **5.1 — Email dispatch log model** 🔴
  **Acceptance:**
  - `EmailMessage` model: `id`, `userId`, `to`, `subject`, `templateName`, `providerMessageId`, `status` (QUEUED/SENT/BOUNCED/FAILED), `attemptCount`, `lastAttemptAt`, `errorMessage`, `createdAt`.
  - Every `sendEmail()` call writes a row.

- **5.2 — SMS dispatch log model** 🟡
  **Acceptance:** Analog to 5.1 with `SmsMessage`. (Defer if SMS channel not yet active.)

- **5.3 — Retry queue with exponential backoff** 🔴
  As ops, I want failed notifications auto-retried so a 5-minute provider hiccup doesn't drop messages.
  **Acceptance:**
  - `nextRetryAt` column on each dispatch log.
  - Cron (every 5 min) sweeps `status = FAILED AND attemptCount < 5 AND nextRetryAt <= NOW()`.
  - Backoff schedule: 1 min, 5 min, 30 min, 2h, 24h → dead-letter.

- **5.4 — Dead-letter inbox** 🟡
  **Acceptance:**
  - After 5 failed attempts, notification moves to `DEAD_LETTER` status.
  - `/settings/admin/notifications/dead-letter` page lists them with "Retry" and "Discard" actions.
  - Daily summary email to platform admins.

- **5.5 — Webhook receiver for delivery status** 🟡
  **Acceptance:**
  - `/api/webhooks/resend` — receives Resend bounce/complaint events.
  - `/api/webhooks/whatsapp` — already exists? verify and extend to update `WhatsAppMessage` status on read/failed.
  - Signature verification on every webhook (no open endpoints).

- **5.6 — Templatized bilingual emails** 🟡
  **Acceptance:**
  - Templates for: welcome, email-verification, password-reset, staff-invite, 2FA code, invoice-sent, statement-ready, task-assigned, shipment-stage-milestone, demurrage-warning.
  - Each template ships AR + EN variants.
  - Only `invoice-email.tsx` exists today (`src/emails/`).

- **5.7 — Quiet-hours respected per user timezone** 🟢
  **Acceptance:**
  - `NotificationPreference` already has `quietHoursStart`/`End`/`timezone`.
  - `dispatchNotification` verifies them; current implementation flagged as partial — add tests.

---

## Epic 6: Observability & Audit Coverage 🔴

**Goal** — Every mutation leaves an audit trail; every error reaches Sentry with a correlation ID; every cron heartbeats; slow queries surface.

### Stories

- **6.1 — Audit log coverage gap** 🔴
  As a compliance auditor, I want every create/update/delete recorded so I can answer "who did what, when".
  **Acceptance:** Add `logAudit(...)` to these modules (currently missing):
  - `marketplace/actions.ts` (vendor approval, service CRUD, request lifecycle)
  - `project/actions.ts` (create/update/delete)
  - `task/actions.ts` (assign, complete, delete)
  - `customer/actions.ts` (CRUD, status toggle)
  - `finance/fees/actions.ts`, `expenses/actions.ts`, `accounts/actions.ts`, `wallet/actions.ts`, `reports/actions.ts`
  - `settings/integrations`, `settings/organization` non-team mutations
  - Automated test: every exported server action has at least one `logAudit` call on mutations.

- **6.2 — Correlation ID propagation** 🟡
  As an SRE, I want a single `requestId` following a request from edge → server action → DB query → Sentry span.
  **Acceptance:**
  - Middleware sets `x-request-id` header (nanoid).
  - Pipe through `src/lib/logger.ts` and Sentry `setTag('requestId', id)`.
  - Logged alongside every error.

- **6.3 — Structured JSON logging in production** 🟡
  **Acceptance:**
  - `logger.ts` emits JSON when `NODE_ENV=production` (timestamp, level, message, fields, requestId, userId).
  - Pretty-printed only in dev.
  - Compatible with Vercel's log drain format.

- **6.4 — Cron heartbeat table** 🟡
  **Acceptance:**
  - `CronRun` model: `id`, `name`, `startedAt`, `completedAt`, `status`, `itemsProcessed`, `errorMessage`.
  - Both crons (`reminders`, `demurrage`) write a row on start/end.
  - Daily dashboard: crons that haven't run in 48h highlighted in red.

- **6.5 — Slow query logging** 🟡
  **Acceptance:**
  - Prisma middleware logs any query > 500ms to Sentry as a warning with SQL + params (params redacted).
  - Dashboard: top 20 slowest queries this week.

- **6.6 — Health endpoint expansion** 🟡
  **Acceptance:**
  - `/api/health` returns JSON: `{ db, redis, resend, whatsapp, sentry, crons: { reminders_last_run, demurrage_last_run } }`.
  - Each sub-check has timeout of 2s.
  - `/api/health/ready` for load balancer (fast, DB only); `/api/health/live` for deep check.

- **6.7 — Sentry source-map upload verified** 🟡
  **Acceptance:**
  - CI step confirms `.next/static/chunks/*.js.map` uploaded to Sentry on every deploy.
  - Sentry issue view shows original TS source, not minified.

---

# Phase 2 — Regulatory & Domain Automation

> These unlock Mazin's actual value proposition — automating the manual, paper-heavy, phone-call-driven Port Sudan clearance workflow. Many have regulatory deadlines (ACD mandatory Jan 2026).

## Epic 7: ACD Automation & Compliance 🛂🔴

**Goal** — Full Advance Cargo Declaration lifecycle — from trader requesting a declaration to ACN appearing on the B/L 72 hours before cargo loading — with alerts and validation.

**Why it matters** — ACD becomes **mandatory on Jan 1, 2026**. Missing the 5-day-before-arrival window = demurrage + fines + possible cargo seizure.

### Stories

- **7.1 — Extend ACD model for full lifecycle** 🔴🛂
  **Acceptance:**
  - Confirm fields: `acnNumber`, `submittedAt`, `validatedAt`, `expectedArrivalDate`, `cargoLoadingDate`, `blNumber`.
  - States: `DRAFT → SUBMITTED → VALIDATED → REJECTED → EXPIRED`.
  - Rejection reason captured.

- **7.2 — ACD form with HS auto-suggest** 🔴🛂
  **Acceptance:**
  - `/customs/new` form collects: consignor, consignee, vessel, voyage, origin port, destination port, commodity description, HS code (autosuggest), weight, volume, package count, container IDs.
  - Validation: HS code matches commodity description (semantic check).
  - Bilingual (AR/EN).

- **7.3 — 72-hour pre-loading alert** 🔴🛂
  **Acceptance:**
  - Cron: for each ACD where `cargoLoadingDate` is in 72h ± 2h AND `status != SUBMITTED`, notify agent + trader via WhatsApp + email.
  - Bilingual message template.

- **7.4 — 5-days-before-arrival validation** 🔴🛂
  **Acceptance:**
  - Cron: for each `VALIDATED` ACD where `expectedArrivalDate` is in 5d ± 1d, verify ACN number is on attached B/L (OCR check — depends on Epic 12).
  - If missing, alert agent HIGH severity.

- **7.5 — ACN collision / duplicate detection** 🟡🛂
  **Acceptance:**
  - Unique constraint on `(companyId, acnNumber)`.
  - Attempted duplicate surfaces clear error.

- **7.6 — ACD dashboard** 🟡🛂
  **Acceptance:**
  - `/customs` shows ACD list filterable by status, date range, vessel.
  - Summary cards: `PENDING (n)`, `SUBMITTED (n)`, `EXPIRING IN 5 DAYS (n)`.

---

## Epic 8: Duty Calculator & HS Code Database 🛂💰

**Goal** — Replace manual rate entry with HS-code–driven duty calculation using Sudan's actual tariff schedule.

### Stories

- **8.1 — Seed HS code database** 🔴🛂
  **Acceptance:**
  - `HsCode` table seeded with Sudan's tariff book (ASYCUDA export): 8-digit code, AR+EN description, IMD%, ADT%, VAT%, excise flag, SSMO required boolean.
  - Source: Sudan Customs Authority tariff book (PDF or Excel from docs/).
  - Migration + seed script: `prisma/seeds/hs-codes.ts`.

- **8.2 — Full calculator: CIF + IMD + ADT + VAT + other taxes** 🔴🛂💰
  **Acceptance:**
  - Formula:
    ```
    CIF = FOB + Freight + Insurance
    ImportDuty (IMD) = CIF × IMD%
    AdditionalTax (ADT) = CIF × ADT%
    Excise = CIF × Excise% (if applicable)
    BSS, STP, PLS, CMP, FRM, DIT, CAT — fixed or % per HS
    VAT (17%) = (CIF + IMD + ADT + Excise) × 0.17
    Total = CIF + IMD + ADT + Excise + Other + VAT
    ```
  - Unit tests covering 15 representative HS codes.

- **8.3 — Multi-line declaration support** 🟡🛂💰
  **Acceptance:**
  - Single declaration can have N line items each with own HS code.
  - Totals roll up.

- **8.4 — Duty quote sharing** 🟢💰
  **Acceptance:**
  - Trader can request a pre-shipment duty estimate; agent approves and shares as PDF.
  - Estimate expires in 30 days (rates change).

- **8.5 — HS code search UX** 🟡🛂
  **Acceptance:**
  - `/customs/hs-search` — autocomplete search in AR + EN.
  - Keyboard-navigable, RTL-aware.

---

## Epic 9: IM Form Lifecycle & Bank Forex 🛂💰🔴

**Goal** — Automate IM Form tracking from Proforma Invoice through Commercial Invoice reconciliation, with expiry alerts and 5% variance detection.

**Why it matters** — Without IM Form, no foreign currency can be allocated. Expired IM = shipment stuck at port. 2025 CBS rules prohibit cash replenishment, so every import cycle is tightly regulated.

### Stories

- **9.1 — IM Form state machine** 🔴🛂
  **Acceptance:**
  - States: `REQUESTED → SUBMITTED → APPROVED → FOREX_RELEASED → RECONCILED → EXPIRED`.
  - Per shipment, `IMForm` record tracks: bank name, IM number, proforma ref, commercial invoice ref, currency, amount, issueDate, expiryDate.

- **9.2 — Expiry alert ladder** 🔴🛂
  **Acceptance:**
  - Cron alerts at 10d / 5d / 3d / 1d before `expiryDate`.
  - Escalate channel: in-app → email → WhatsApp → manager.

- **9.3 — 5% variance check** 🔴🛂💰
  **Acceptance:**
  - When Commercial Invoice attached, compare value vs Proforma.
  - Variance > 5% = `WARN`. Variance > 15% = `HIGH` severity alert to agent + client.
  - Audit log entry on variance detection.

- **9.4 — IM document bundle export** 🟡🛂
  **Acceptance:**
  - Single ZIP with Proforma + Commercial + B/L + Packing List for bank submission.

- **9.5 — Bank-code formatter** 🟡🛂
  **Acceptance:**
  - Format `BBYYMMNNNNNN` validated; UI auto-inserts bank prefix.
  - Al Nile (40), Khartoum, Omdurman National (OMDBSDKH) preloaded in `Bank` reference table.

---

## Epic 10: SSMO Inspection Workflow 🛂

**Goal** — Track SSMO inspection requests for regulated commodities (chemicals, food, construction materials, textiles, electronics, pharma, vehicles, cosmetics) through to FR release certificate.

### Stories

- **10.1 — SSMO-required auto-flag** 🔴🛂
  **Acceptance:**
  - When HS code matches a regulated category, shipment auto-flags `ssmoRequired = true`.
  - UI displays red badge; blocks customs submission until SSMO inspection scheduled.

- **10.2 — Inspection request form** 🟡🛂
  **Acceptance:**
  - Form collects: sample type, inspector preference (TÜV Rheinland / Cotecna), scheduled date, location (CFS A/B/C).
  - Generates printable request letter.

- **10.3 — FR release certificate tracking** 🟡🛂
  **Acceptance:**
  - `FR\d{7}` regex-validated.
  - `issuedDate`, `expiryDate` (1 month validity) captured.
  - Expiry alert at 7d / 3d / 1d.

- **10.4 — Inspector appointment calendar integration** 🟢
  **Acceptance:** iCal export for inspector appointments.

---

## Epic 11: Demurrage & Container Timeline 🛂💰

**Goal** — Per-container free-time timer with escalating alerts.

### Stories

- **11.1 — Container free-time config** 🟡🛂💰
  **Acceptance:**
  - Per shipping-line rules: CMA CGM = 14d, Eastern = 14d, Al Arbab = 7d (configurable).
  - `Container.freeTimeDays`, `gateInAt` tracked.

- **11.2 — Demurrage alert ladder** 🔴🛂💰
  **Acceptance:**
  - Alerts at: 7d remaining, 3d, 1d, 0d (expired).
  - Post-expiry: daily rate charged accumulates in `Container.demurrageAccrued`.
  - Multi-channel escalation: app → SMS → WhatsApp → phone-call task for agent.

- **11.3 — Demurrage invoice auto-generation** 🟡💰
  **Acceptance:**
  - When container released with accrued demurrage, line item appears on client's next stage invoice.

- **11.4 — Daily cron already exists** ✅
  **Acceptance:** `/api/cron/demurrage` exists per memory; verify it wires into alerts above and audit logs each run.

---

## Epic 12: Document OCR & Data Extraction 🛂

**Goal** — Ship production-grade OCR replacing the stubbed receipt extractor.

**Why it matters** — `src/components/platform/finance/receipt/ai/extract-receipt-data.ts` returns hardcoded `"Sample Merchant"`. Every document is currently transcribed manually.

### Stories

- **12.1 — Implement Anthropic-based receipt OCR** 🔴
  **Acceptance:**
  - Uses `@ai-sdk/anthropic` (already in deps) with Claude vision.
  - Handles Arabic + English receipts.
  - Extracts: merchant, date, amount, currency, tax, line items.
  - Structured output via Zod schema validation.
  - Accuracy > 90% on seed test set of 50 real receipts.

- **12.2 — Invoice OCR** 🟡🛂
  **Acceptance:** Extracts invoice number, date, parties, line items, totals, VAT; maps to `Invoice` model.

- **12.3 — B/L OCR with ACN number detection** 🔴🛂
  **Acceptance:**
  - Extracts B/L number, vessel, voyage, origin/destination, containers, ACN if present.
  - If ACN missing, surfaces warning.

- **12.4 — Packing List OCR** 🟡🛂
  **Acceptance:** Extracts item descriptions, quantities, weights, HS suggestions.

- **12.5 — Certificate of Origin OCR** 🟢🛂
  **Acceptance:** Extracts origin country, exporter; used for preferential duty rate calc.

- **12.6 — OCR confidence thresholds & human review** 🟡
  **Acceptance:**
  - Extracted fields with confidence < 80% flagged for review.
  - Side-by-side review UI: original PDF on left, extracted fields on right, editable.

---

## Epic 13: ASYCUDA World Integration 🛂

**Goal** — Machine-to-machine submission of IM4 declarations to Sudan Customs' ASYCUDA World (UNCTAD) system.

**Why it matters** — Manual data entry in ASYCUDA is the biggest time sink. API integration unlocks submission from within Mazin.

### Stories

- **13.1 — Investigate ASYCUDA API availability** 🔴🛂
  **Acceptance:**
  - Research spike: is there a public API, SFTP batch, or only human UI?
  - If UI-only: plan browser-automation fallback (Playwright server-side).
  - Document findings in `docs/integrations/asycuda.md`.

- **13.2 — IM4 declaration submit** 🟡🛂
  **Acceptance:**
  - Mazin's declaration → ASYCUDA XML → submit.
  - Assessment Notice returned & stored.
  - Status syncs back.

- **13.3 — Bank code lookup** 🟢🛂
  **Acceptance:**
  - Bank codes seeded from ASYCUDA; lookup by SWIFT/name.

- **13.4 — Audit trail for every submission** 🟡
  **Acceptance:** Full payload captured, redacted on display, purged after 2 years per data retention policy.

---

## Epic 14: Exchange Rate & FX Snapshots 🛂💰

### Stories

- **14.1 — Daily CBS rate fetcher** 🔴💰
  **Acceptance:**
  - Cron pulls Central Bank of Sudan's daily USD/SDG rate.
  - Persists in `ExchangeRate` with `source: CBS`.
  - Fallback: manual override with audit log.

- **14.2 — Snapshot rate at declaration/invoice creation** 🔴💰
  **Acceptance:**
  - `Invoice.exchangeRate`, `CustomsDeclaration.exchangeRate` captured at insert.
  - Later FX drift does not retroactively change totals.

- **14.3 — Multi-currency display** 🟡
  **Acceptance:**
  - User preference toggles AR, SDG, USD.
  - Headline amount always in SDG; USD shown secondarily.

- **14.4 — Stale rate auto-deactivation** 🟡
  **Acceptance:**
  - Rates > 7 days old marked `isActive = false`.
  - UI warning when using stale rate.

---

# Phase 3 — Module Completion

> Each platform module audited for CRUD completeness, validation, authorization, tests, and i18n. Ship the gaps.

## Epic 15: Customer (CRM) Module 🟡

### Stories

- **15.1 — Detail page** 🟡
  **Acceptance:**
  - `/customer/[id]/page.tsx` with: profile, contact, shipments, invoices, statements, open AR balance, activity timeline.

- **15.2 — Edit page or dialog** 🟡
  **Acceptance:**
  - Edit flow with Zod validation in `src/components/platform/customer/validation.ts` (new).
  - All fields bilingual.

- **15.3 — Client import from Excel** 🟢
  **Acceptance:** Upload CSV/XLSX of clients; validate; import with transaction.

- **15.4 — Test coverage** 🟡
  **Acceptance:** Component tests for form, table, row actions; E2E for create → edit → delete.

- **15.5 — i18n** 🟡
  **Acceptance:** All customer UI strings pulled from dictionary, AR + EN.

---

## Epic 16: Shipments Lifecycle 🔴

### Stories

- **16.1 — Full stage-machine test coverage** 🟡
  **Acceptance:** `stage-machine.ts` has unit tests covering every transition, forward and backward; invalid transitions rejected.

- **16.2 — Bulk stage advance** 🟢
  **Acceptance:** Select N shipments → advance stage in single action with audit log entries.

- **16.3 — Shipment search & filter** 🟡
  **Acceptance:** Filter by: stage, status, client, vessel, date range, container number, HS category, urgency.

- **16.4 — Shipment detail view** 🟡
  **Acceptance:** Unified detail with tabs: overview, stages, documents, containers, invoices, payments, audit trail.

- **16.5 — Delete shipment (soft)** 🟡
  **Acceptance:** Admin-only, soft-delete, confirmable, audit-logged.

- **16.6 — Shipment duplication** 🟢
  **Acceptance:** "Duplicate" action copies fields (minus stages, docs, payments) for recurring clients.

- **16.7 — Missing tests** 🟡
  **Acceptance:** `src/components/platform/shipments/__tests__/` directory with component + action tests.

---

## Epic 17: Invoice & Statement of Account 💰🟡

### Stories

- **17.1 — Move actions into component folder** 🟡
  **Acceptance:**
  - `src/actions/invoice.ts` (1029L) relocated to `src/components/platform/invoice/actions.ts` per colocation convention.
  - All imports updated; build green.

- **17.2 — Module test folder** 🟡
  **Acceptance:** `src/components/platform/invoice/__tests__/` with form, table, detail component tests.

- **17.3 — Stage invoice linkage** 🟡💰
  **Acceptance:**
  - Each invoice line can link to a `TrackingStage` for cost attribution.
  - Statement of Account aggregates by stage per shipment.

- **17.4 — Statement PDF export** ✅ (verify)
  **Acceptance:** `/api/statement/[id]/pdf` exists; add rate limit (Epic 1.4), timeout wrapping, bilingual template.

- **17.5 — Invoice email send with tracking** 🟡
  **Acceptance:**
  - Resend "Send" button emails invoice PDF to client.
  - Email open tracking via Resend pixel.
  - Audit log entry per send.

- **17.6 — Invoice voiding & credit notes** 🟡💰
  **Acceptance:**
  - Void action creates `INVOICE_VOIDED` audit entry + reversal journal entry.
  - Credit note as separate invoice type.

- **17.7 — Aging report** 🟢💰
  **Acceptance:**
  - `/finance/reports/aging` — 0–30, 31–60, 61–90, 90+ buckets per client.

---

## Epic 18: Team, Roles, and Staff Invites 🟡

### Stories

- **18.1 — Flesh out team module** 🟡
  **Acceptance:**
  - `/team` page shows team roster with roles, last-seen, status.
  - Row actions: change role, suspend, remove.
  - Bulk invite via CSV.

- **18.2 — Role management UI** 🟡
  **Acceptance:**
  - `/settings/roles` — define custom roles with permission matrix (per Prisma `authorization.ts`).
  - Currently only `UserRole` enum (ADMIN/MANAGER/CLERK/VIEWER) — consider `Role` model for future flexibility.

- **18.3 — Permission audit view** 🟡
  **Acceptance:** `/settings/security/permissions` shows per-role permission matrix, exportable for audit.

- **18.4 — Tests** 🟡
  **Acceptance:** Component tests for team table, invite flow E2E.

---

## Epic 19: Banking & Reconciliation 💰🟡

### Stories

- **19.1 — Unstub banking types** 🟡
  **Acceptance:**
  - Placeholders at `src/components/platform/finance/banking/types/bank.types.ts` regenerated from current Prisma (Epic 2 dependency).

- **19.2 — Bank statement import** 🟡💰
  **Acceptance:**
  - Upload CSV/OFX statement; parse; stage as `BankStatement` + `BankTransaction` rows pending reconciliation.

- **19.3 — Reconciliation engine** 🟡💰
  **Acceptance:**
  - Match bank transactions to app transactions by: amount ± 1 SDG, date ± 3 days, reference text.
  - Manual match UI for unmatched.

- **19.4 — Plaid or local bank API integration** 🟢💰
  **Acceptance:** Research Sudanese bank API availability (Al Nile, Khartoum Bank); if none, document manual-import-only strategy.

- **19.5 — Payment transfer UX** 🟡💰
  **Acceptance:**
  - `/finance/banking/payment-transfer` existing page audited; ensure it creates `Transaction` + posts journal entry.
  - Rate-limited (sensitive operation).

- **19.6 — Tests** 🟡
  **Acceptance:** Component + unit tests for reconciliation engine; E2E for transfer flow.

---

## Epic 20: Payroll & Salary 💰🟡

### Stories

- **20.1 — Payroll run E2E** 🟡💰
  **Acceptance:**
  - Monthly payroll run: pull all employees, compute gross → deductions → net, generate payslips.
  - Mark as `FINALIZED` → journal entry posted (Epic 4.3).

- **20.2 — Sudan-specific payroll** 🟡💰
  **Acceptance:**
  - Social insurance (zakat-exempt) and income tax brackets configurable.
  - Eid bonus rule support.

- **20.3 — Payslip PDF & email** 🟡
  **Acceptance:** Bilingual payslip PDF emailed to each employee on finalize.

- **20.4 — Timesheet → payroll integration** 🟡
  **Acceptance:** Approved timesheets feed payroll hour calculations.

- **20.5 — Tests** 🟡
  **Acceptance:** Complete unit tests for payroll math; E2E for "create → approve → finalize".

---

## Epic 21: Expenses, Budgets, Fees 💰🟡

### Stories

- **21.1 — Expense approval workflow** 🟡💰
  **Acceptance:**
  - States: `DRAFT → SUBMITTED → APPROVED → REJECTED → PAID`.
  - Approver rules by amount threshold (< 500K auto-approve, ≥ 500K manager, ≥ 5M admin).
  - On `PAID`: journal entry + audit log.

- **21.2 — Budget-vs-actual dashboard** 🟡💰
  **Acceptance:**
  - Per-category: budgeted, spent, committed (approved but not paid), variance.
  - Alerts when budget utilization > 80%.

- **21.3 — Fee templates → invoice auto-generation** 🟡💰
  **Acceptance:**
  - Admin defines fee template per stage (e.g., `DUTY_CALCULATED → generate IMD/ADT/VAT lines`).
  - `stage-invoice.ts` already exists; ensure it reads templates.

- **21.4 — Reconcile dual fields on Expense** (see 2.5) 🟡

- **21.5 — Tests** 🟡
  **Acceptance:** Coverage for budget calculations, expense approval transitions.

---

## Epic 22: Marketplace for Services 🟢💰

### Stories

- **22.1 — Vendor onboarding flow** 🟡
  **Acceptance:**
  - Application form (company, license, certifications).
  - Admin approval → vendor becomes `APPROVED`.
  - Welcome email.

- **22.2 — Service listing CRUD (vendor-facing)** 🟡
  **Acceptance:** Vendor can create/edit/disable their service listings.

- **22.3 — Order flow** 🟡💰
  **Acceptance:**
  - Client orders a service → `ServiceRequest` created.
  - Vendor accepts/declines.
  - Status transitions: `REQUESTED → ACCEPTED → IN_PROGRESS → DELIVERED → CLOSED`.
  - On `DELIVERED`: platform-commission invoice generated.

- **22.4 — Ratings & reviews** 🟢
  **Acceptance:**
  - New model `VendorReview`.
  - Client rates vendor 1–5 stars + comment after `DELIVERED`.
  - Average rating on listing card.

- **22.5 — Commission settlement** 🟢💰
  **Acceptance:**
  - Platform commission % configurable per category.
  - Settlement run monthly → vendor `Transaction` + platform revenue journal entry.

- **22.6 — Tests** 🟢
  **Acceptance:** Unit tests for commission math; E2E for request → accept → deliver.

---

## Epic 23: Task Management 🟡

### Stories

- **23.1 — Kanban board view** 🟢
  **Acceptance:** Drag-drop between `TODO / IN_PROGRESS / DONE` columns (`@dnd-kit` already in deps).

- **23.2 — Recurring tasks** 🟢
  **Acceptance:** RRULE-based recurrence (weekly, monthly).

- **23.3 — Task assignment rules** 🟡
  **Acceptance:** `TaskAssignmentRule` already in schema; UI to create rules ("when shipment enters `INSPECTION`, assign task X to user Y").

- **23.4 — Audit log coverage** 🟡 (see 6.1)

- **23.5 — Task comments thread** 🟢
  **Acceptance:** `TaskComment` model; comment thread on task detail page; @mentions trigger notification.

---

## Epic 24: Project Workspace 🟡

### Stories

- **24.1 — Sub-route completeness audit** 🟡
  **Acceptance:** Each of `/project/[id]/{plan, mos, itp, acd, docs, quote, report, payments, invoices, containers, duty}` audited — confirm functional or remove.

- **24.2 — Project activities schema formalization** 🟡
  **Acceptance:**
  - `Project.activities Json?` → dedicated `ProjectActivity` model with typed events.
  - Migration backfills existing JSON.

- **24.3 — Project members join table** 🟡 (see 2.4)

- **24.4 — Project templates** 🟢
  **Acceptance:** Save a project as template; new projects created from template.

---

# Phase 4 — Platform Quality

## Epic 25: Internationalization Completeness (AR/EN) 🟡

**Goal** — Every user-facing string routes through `dict`; no hardcoded English in Arabic views or vice versa.

### Stories

- **25.1 — Component-level dict audit** 🔴
  **Acceptance:**
  - Automated check: grep in all `src/components/platform/**/*.tsx` for unlocalized string literals in JSX.
  - Currently most components have zero `dict` imports; pages pass strings down inconsistently.
  - Target: 0 hardcoded user-facing English in non-page components.

- **25.2 — Missing translations in register/login forms** 🔴
  **Acceptance:**
  - `src/components/auth/join/form.tsx:75,89,105,121,139,145` hardcoded strings moved to `ar.json`/`en.json`.
  - Applies to login, reset, new-password, invite-accept forms.

- **25.3 — Dictionary type safety** 🟡
  **Acceptance:**
  - Generate TS types from `en.json` so missing keys surface as type errors.
  - `getDictionary(lang).foo.bar` is type-checked.

- **25.4 — Arabic pluralization** 🟡
  **Acceptance:**
  - Arabic has 6 plural forms; use `Intl.PluralRules`.
  - Strings with counts use `{{count, plural, ...}}` format.

- **25.5 — Date and currency formatting** 🟡
  **Acceptance:**
  - Use `Intl.DateTimeFormat(lang)` and `Intl.NumberFormat(lang, { style: 'currency', currency: 'SDG' })` consistently.
  - Audit for raw `toLocaleString` calls without locale argument.

---

## Epic 26: Accessibility & RTL Polish 🟡

### Stories

- **26.1 — Form labels everywhere** 🔴
  **Acceptance:**
  - Login, register, reset, invite-accept — replace placeholders with `<Label>` + `<Input>`.
  - WCAG 3.3.2 compliance.

- **26.2 — Landmark roles on marketing** 🟡
  **Acceptance:**
  - `<nav>`, `<main>`, `<footer>` tags correct; `role="navigation"` where needed.
  - Marketing footer gains `aria-` attributes.

- **26.3 — RTL audit** 🟡
  **Acceptance:**
  - Audit every margin/padding for `left/right` → `start/end` logical properties.
  - Test AR screenshots at every breakpoint vs EN.

- **26.4 — Keyboard navigation** 🟡
  **Acceptance:** Every interactive element reachable by Tab; focus ring visible; no focus traps.

- **26.5 — Alt text on meaningful images** 🟡
  **Acceptance:** Marketing, about-page, testimonial images have semantic alt text (not decorative `alt=""`).

- **26.6 — Color contrast audit** 🟢
  **Acceptance:** WCAG AA (4.5:1 text, 3:1 UI) verified across all themes.

---

## Epic 27: Mobile Responsiveness 🟡

### Stories

- **27.1 — Heavy platform pages responsive pass** 🔴
  **Acceptance:**
  - `project/[id]/page.tsx`, `finance/dashboard/page.tsx`, `invoice/[id]/page.tsx` — `md:`, `lg:` utilities added.
  - Tables collapse to cards on mobile.

- **27.2 — Mobile navigation drawer** 🟡
  **Acceptance:**
  - Top-level platform nav collapses into drawer on < md.
  - Banking already has one; generalize.

- **27.3 — Touch targets ≥ 44px** 🟡
  **Acceptance:** All buttons, links, tap targets meet Apple HIG minimum.

- **27.4 — Responsive test coverage** 🟡
  **Acceptance:** Playwright suite adds 375×812, 768×1024, 1440×900 matrix for 10 key pages.

---

## Epic 28: Marketing Site Polish 🔴

**Why it matters** — These are the first impression; every gap is a credibility killer for a B2B SaaS.

### Stories

- **28.1 — Replace stock Unsplash board photos** 🔴
  **Acceptance:**
  - `src/app/[lang]/about/page.tsx:146-153` — swap 8 Unsplash URLs for real ABDOUT GROUP leadership photos OR remove section until photography available.

- **28.2 — Replace testimonial placeholder image** 🔴
  **Acceptance:** `src/components/marketing/testimonial.tsx:43` uses real customer photo (with consent) or neutral stock illustration, not random Unsplash.

- **28.3 — Fix broken footer links** 🔴
  **Acceptance:**
  - `src/components/marketing/footer.tsx:30-56`: `careers`, `helpCenter`, `documentation`, `status`, `blog`, `features` — all link to real pages or removed from nav.
  - `#services`, `#solutions`, `#pricing` — ensure target anchors exist on landing page.

- **28.4 — Fix `contianer.jpg` filename typo** 🟡
  **Acceptance:** Rename to `container.jpg` and update references in `about/page.tsx:69`, `services/page.tsx:29`.

- **28.5 — Marketing copy review** 🟡
  **Acceptance:** Professional Arabic copywriter reviews `ar.json` marketing keys; same for English.

- **28.6 — Remove orphan `/service` directory** 🟡
  **Acceptance:** `/app/[lang]/service/` removed or merged into `/services/`.

- **28.7 — Blog/resources content system** 🟢
  **Acceptance:** MDX-based blog or link to external blog; include at least 5 SEO articles about ACD, customs clearance in Sudan.

---

## Epic 29: Public Tracking Hardening 🔴🔐

### Stories

- **29.1 — Rate limit tracking** 🔴 (see 1.2)

- **29.2 — Respect `publicTrackingEnabled` flag** 🔴🔐
  **Acceptance:**
  - `src/actions/tracking.ts:56` filter by `shipment.publicTrackingEnabled = true`.
  - UI toggle per shipment in detail page.

- **29.3 — Remove hardcoded demo tracking numbers** 🟡
  **Acceptance:**
  - `/track` landing no longer shows `TRK-ABC123` / `TRK-XYZ789` unless they resolve in current DB.
  - Replace with "Enter your tracking number" CTA.

- **29.4 — SEO & social preview** 🟢
  **Acceptance:**
  - `/track` has `<meta>` OG + Twitter cards.
  - `/track/[id]` has `robots: noindex` (already set, verify) + no PII in title.

- **29.5 — Tracking number enumeration resistance** 🟡🔐
  **Acceptance:**
  - Trackings use 32-char slug (not 6-char nanoid) OR add signed query token.
  - Reduce scraping attack surface.

---

## Epic 30: Authentication UX & 2FA Enforcement 🟡🔐

### Stories

- **30.1 — Enforce 2FA on admin/manager roles** 🔴🔐
  **Acceptance:**
  - On first login as ADMIN/MANAGER, force 2FA setup before any platform access.
  - Backup codes (10 one-time codes) issued.

- **30.2 — TOTP authenticator app** 🟡🔐
  **Acceptance:**
  - Current 2FA is email-OTP; add TOTP (Google Authenticator compatible).
  - `TwoFactorSecret` model stores encrypted secret.

- **30.3 — Password strength indicator** 🟡
  **Acceptance:**
  - Live strength meter on register/reset/change-password forms.
  - zxcvbn library (or equivalent) — reject score < 3.

- **30.4 — Password reset doesn't leak emails** 🔴🔐
  **Acceptance:**
  - `src/components/auth/reset/action.ts:24` — always return generic success regardless of email match.
  - Email either sends "you requested a reset" or "someone tried to reset your account".

- **30.5 — GitHub OAuth** 🟢
  **Acceptance:** Add GitHub provider to `src/auth.config.ts`; UI button; env vars.

- **30.6 — Magic link login** 🟢
  **Acceptance:** `EmailProvider` from NextAuth for passwordless flow; opt-in per tenant.

- **30.7 — Invite acceptance UX improvements** 🟡
  **Acceptance:**
  - Password complexity matches `RegisterSchema` (uppercase + digit).
  - Clear expiry-passed UX.
  - Use same `FormError`/`FormSuccess` pattern as rest of auth, not mixed sonner.

---

## Epic 31: Testing Coverage 🟡

**Goal** — Raise coverage to > 80% across modules, add missing E2E, institute coverage gate.

### Stories

- **31.1 — Coverage gate in CI** 🔴
  **Acceptance:**
  - CI runs `pnpm test:coverage --run`.
  - Fails if overall coverage < 75% (baseline) or any new file < 60%.
  - Coverage report uploaded as artifact.

- **31.2 — Component tests for zero-coverage modules** 🟡
  **Acceptance:** Add `__tests__/` to:
  - `customs/` (actions + form + detail)
  - `shipments/` (form, stage-timeline, table)
  - `invoice/` (form, table, detail)
  - `team/` (full module)
  - `finance/{payroll, banking, salary, timesheet, receipt, authority, budget, permissions}`

- **31.3 — E2E for critical journeys** 🟡
  **Acceptance:** New Playwright specs:
  - Full shipment lifecycle: create → add B/L → advance to CUSTOMS_DECLARATION → add HS → generate duty invoice → mark paid.
  - Invite staff → accept invite → first login → 2FA setup.
  - Create demurrage scenario → alerts trigger → resolve.

- **31.4 — Multi-browser E2E** 🟡
  **Acceptance:** CI runs Chromium + Firefox + WebKit.

- **31.5 — Mobile E2E** 🟢
  **Acceptance:** Separate Playwright project for mobile viewports; runs on 3 key flows.

- **31.6 — Visual regression** 🟢
  **Acceptance:** Percy or Chromatic snapshots of 20 key pages; block PRs on diff > threshold.

- **31.7 — Accessibility tests** 🟡
  **Acceptance:** axe-core integrated in Playwright; zero violations on marketing + tracking pages.

- **31.8 — Load test** 🟢
  **Acceptance:** k6 script hitting `/track/*`, `/api/health`, `/api/invoice/*/pdf` at 100 rps for 5 min with < 1% errors.

---

## Epic 32: CI/CD Pipeline Hardening 🟡

### Stories

- **32.1 — Matrix split** 🟡
  **Acceptance:** type-check / lint / unit-test / build run as parallel jobs.

- **32.2 — Dependency scanning** 🟡🔐
  **Acceptance:**
  - `pnpm audit --audit-level high` step.
  - Snyk or GitHub Dependabot auto-PRs.
  - SBOM (Software Bill of Materials) generated per release.

- **32.3 — Staging environment** 🔴
  **Acceptance:**
  - Separate Vercel project scoped to `staging` branch.
  - `.env.staging` vars.
  - `main` deploys prod; PR deploys preview; merging to `staging` deploys staging.

- **32.4 — Release tags & changelog** 🟡
  **Acceptance:**
  - Conventional Commits enforced via commitlint.
  - `changesets` or `release-please` generates `CHANGELOG.md` per release.

- **32.5 — Bundle-size budget** 🟡
  **Acceptance:**
  - GH Action fails if first-load JS > 300KB for any page.
  - `@next/bundle-analyzer` report in PR comment.

- **32.6 — Lighthouse CI** 🟢
  **Acceptance:**
  - Performance, accessibility, best-practices, SEO all ≥ 90.
  - Blocks merge if score drops.

- **32.7 — Sentry release tracking** 🟡
  **Acceptance:** Each deploy = new Sentry release; source maps verified uploaded.

---

## Epic 33: Performance Optimization 🟡

### Stories

- **33.1 — Deduplicate `framer-motion` + `motion`** 🟡
  **Acceptance:** Pick one; remove the other from deps; update imports.

- **33.2 — Dynamic import heavy libs** 🟡
  **Acceptance:**
  - `@react-pdf/renderer` dynamically imported only in PDF route.
  - `three` + `@react-three/*` lazy-loaded in `marketing/gas/container-3d.tsx`.
  - `xlsx` lazy-loaded in import/export paths.
  - `recharts` split per chart, lazy-loaded on dashboard.

- **33.3 — Prisma query pooling config** 🟡
  **Acceptance:**
  - `src/lib/db.ts` — explicit `connection_limit`, `pool_timeout`, `statement_timeout`.
  - Documented in `docs/deployment.md`.

- **33.4 — N+1 query detection** 🟡
  **Acceptance:**
  - Audit server actions for `.map(async id => prisma.x.findUnique)` patterns.
  - Replace with `findMany({ where: { id: { in: ids } } })` or `include`.

- **33.5 — Server component parallel fetching** 🟡
  **Acceptance:**
  - Every server component with > 1 data source uses `Promise.all`.
  - No `await` waterfalls.

- **33.6 — Caching strategy** 🟡
  **Acceptance:**
  - `React.cache()` on frequently called tenant-context lookups.
  - Static pages use `revalidate`.
  - Dynamic pages use `fetch(url, { cache: 'force-cache' })` where safe.

- **33.7 — Image optimization** 🟢
  **Acceptance:**
  - Only known raw `<img>`: `src/components/platform/task/column.tsx` → swap to `next/image`.

- **33.8 — Font optimization** 🟢
  **Acceptance:**
  - Geist (local) already optimized.
  - Arabic font (if custom) uses `font-display: swap` + subsetting.

---

## Epic 34: Chatbot Production Readiness 🟢

### Stories

- **34.1 — Move rate limit to Redis** 🔴 (see Epic 1.1)

- **34.2 — Conversation history persistence** 🟡
  **Acceptance:**
  - `ChatMessage` model; history loaded per user (auth) / session (anon).
  - Privacy: anon sessions purged after 24h.

- **34.3 — Tool-calling expansion** 🟡
  **Acceptance:**
  - Tools exposed: `lookupShipment`, `estimateDuty`, `searchHsCode`, `listOpenInvoices` (auth-gated).
  - Anon users limited to public tools only.

- **34.4 — Cost guardrails** 🟡💰
  **Acceptance:**
  - Daily LLM spend cap per tenant ($X).
  - Soft throttle when 80% reached; hard block at 100%.

- **34.5 — Prompt versioning** 🟢
  **Acceptance:** Prompts stored in versioned files; A/B comparison of responses.

---

## Epic 35: File Upload, Storage, Virus Scanning 🟡🔐

### Stories

- **35.1 — Cloud storage (S3/R2)** 🔴
  **Acceptance:**
  - `.env`: `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET`.
  - Files uploaded to S3/Cloudflare R2, not Vercel blob/local.
  - Signed URLs for download with 15-min expiry.

- **35.2 — MIME sniffing + magic byte validation** 🔴🔐
  **Acceptance:**
  - Server verifies actual file type matches declared MIME.
  - Allowlist: PDF, JPG, PNG, WebP, XLSX, CSV.
  - Block: executables, archives, scripts.

- **35.3 — Size limits consistent** 🟡
  **Acceptance:**
  - 10MB hard cap (tenant-configurable up to 50MB).
  - Enforced in both Zod schema and upload action.

- **35.4 — Virus scan** 🟡🔐
  **Acceptance:**
  - ClamAV or cloud AV (e.g., S3 Event → Lambda → scan).
  - Infected files quarantined; user notified.

- **35.5 — Upload retry & resumability** 🟢
  **Acceptance:**
  - Multipart upload for > 5MB.
  - Resume on network drop.

- **35.6 — File download audit log** 🟡 (see 6.1)

---

## Epic 36: Billing & Subscriptions (Schematic) 🟢💰

### Stories

- **36.1 — Finalize Schematic decision** 🟡💰
  **Acceptance:**
  - Decide: ship Schematic subscription billing or defer?
  - Currently stubbed in `src/components/platform/finance/receipt/schematic/`.

- **36.2 — Pricing tiers** 🟢💰
  **Acceptance:**
  - Free (5 shipments/mo), Pro (50), Enterprise (unlimited + SLA).
  - Seat-based pricing for teams.

- **36.3 — Usage metering** 🟢💰
  **Acceptance:**
  - Metered: shipments created, OCR pages, PDFs generated, notifications sent.
  - Dashboard: usage-vs-quota.

- **36.4 — Payment methods** 🟢💰
  **Acceptance:**
  - Card via Stripe; bank transfer for Sudanese clients; monthly invoice.
  - Dunning emails on failed charge.

---

# Phase 5 — Growth & Scale

## Epic 37: Client Portal (Trader Self-Service) 🟢

**Goal** — Let traders (importers) self-serve: track shipments, upload documents, approve quotes, pay agent.

### Stories

- **37.1 — Client login scope** 🟢
  **Acceptance:**
  - `UserType.COMMUNITY` role scoped to assigned client.
  - Dashboard shows only their shipments.

- **37.2 — Document upload by client** 🟢
  **Acceptance:** Proforma, Commercial Invoice, Packing List upload; triggers notification to agent.

- **37.3 — Quote approval** 🟢
  **Acceptance:** Agent sends quote → client approves/rejects → auto-creates declaration.

- **37.4 — Online payment** 🟢💰
  **Acceptance:** Client pays agent invoice via card/transfer; receipt auto-generated.

---

## Epic 38: Mobile App & PWA 🟢

### Stories

- **38.1 — PWA manifest & service worker** 🟢
  **Acceptance:** `/manifest.json`, offline shell, install prompt.

- **38.2 — Push notifications** 🟢
  **Acceptance:** Web Push for shipment milestones.

- **38.3 — Native apps (deferred)** 🟢
  **Acceptance:** Decide Capacitor vs React Native; plan a phase-2 project.

---

## Epic 39: Reporting, BI, and Analytics 🟢

### Stories

- **39.1 — Operations dashboard** 🟡
  **Acceptance:**
  - Ops KPIs: shipments/day, avg clearance time, open demurrage, overdue IM Forms, pending ACDs.

- **39.2 — Financial KPIs** 🟡💰
  **Acceptance:**
  - Revenue, AR, AP, gross margin per shipment, per client.

- **39.3 — Custom report builder** 🟢
  **Acceptance:**
  - Drag-drop fields; save/share reports.

- **39.4 — Export to Excel** 🟡
  **Acceptance:** Every list view exports to .xlsx.

---

## Epic 40: Multi-Tenancy & White-Label 🟢

**Goal** — Currently single-tenant per `CompanySettings`. Prepare for multiple clearing agents on one deployment.

### Stories

- **40.1 — Tenant isolation audit** 🟡
  **Acceptance:**
  - Every server action verifies `tenantId` (currently `userId`-scoped).
  - Add `getTenantContext()` to all finance actions (flagged as missing on payroll, banking, banking/transaction actions in 2026-04-24 audit).

- **40.2 — Subdomain routing** 🟢
  **Acceptance:** `abdout.mazin.app` vs `otheragent.mazin.app`.

- **40.3 — White-label branding** 🟢
  **Acceptance:** Per-tenant logo, colors, domain.

- **40.4 — Tenant billing** 🟢💰 (see Epic 36)

---

# Appendix A — Cross-Cutting Definitions

## Definition of Done (per story)
1. Code reviewed (≥ 1 approver).
2. Unit tests added; coverage not worse than baseline.
3. E2E updated if user-facing.
4. i18n AR + EN complete.
5. `logAudit` on every mutation.
6. Error paths return structured errors (not thrown).
7. Accessibility (axe-core clean on new components).
8. Documentation updated.
9. Deployed to staging and smoke-tested.
10. Merged with Conventional Commit message.

## Priority Mapping
| Priority | Meaning | Target phase |
|----------|---------|--------------|
| 🔴 P0 | Blocks production launch | Phase 1–2 |
| 🟡 P1 | Ship before GA announcement | Phase 3–4 |
| 🟢 P2 | Post-launch enhancement | Phase 5 |

## Compliance & Regulatory Deadlines
| Deadline | Item |
|----------|------|
| **Jan 1, 2026** | ACD mandatory (Epic 7) |
| **Ongoing** | SSMO inspection for regulated HS codes (Epic 10) |
| **CBS 2025 rules** | IM Form regulated forex allocation (Epic 9) |
| **ASYCUDA** | IM4 declarations — UNCTAD electronic system (Epic 13) |

## Personas
| Role | Count | Primary surfaces |
|------|-------|------------------|
| Clearing Agent (ADMIN) | 1–3 | Full platform |
| Manager (MANAGER) | 2–5 | Approvals, dashboards, reports |
| Clerk (CLERK) | 5–20 | Shipments, docs, declarations |
| Accountant (CLERK-Finance) | 1–3 | Finance module |
| Trader/Consignee (COMMUNITY) | unlimited | Portal (Epic 37), tracking |
| Platform Admin (SaaS) | 1 | `/settings/admin` |

---

# Appendix B — Production Launch Checklist (Go/No-Go)

Must be green before public launch:

**Security**
- [ ] Rate limiting on all public + auth endpoints (Epic 1.1–1.5)
- [ ] CSP without `unsafe-inline/eval` (Epic 3.1)
- [ ] JWT session rotation (Epic 3.2, 3.3)
- [ ] 2FA enforced for admin/manager (Epic 30.1)
- [ ] Password reset doesn't leak emails (Epic 30.4)
- [ ] CAPTCHA on public forms (Epic 1.5)

**Data**
- [ ] Baseline migration applied (Epic 2.1)
- [ ] Migration drift CI check live (Epic 2.2)
- [ ] FKs enforced (Epic 2.4)
- [ ] Soft-delete on critical models (Epic 2.6)

**Finance**
- [ ] Accounting ledger working OR disabled in UI (Epic 4)
- [ ] Journal entries posted for all payment events (Epic 4.2–4.3)

**Reliability**
- [ ] Notification retry queue live (Epic 5.3)
- [ ] Dead-letter inbox (Epic 5.4)
- [ ] Health endpoint expanded (Epic 6.6)
- [ ] Cron heartbeat (Epic 6.4)
- [ ] Sentry source-maps verified (Epic 6.7)

**Regulatory**
- [ ] ACD automation ready (Epic 7) — **before Jan 1, 2026**
- [ ] Duty calculator seeded (Epic 8.1–8.2)
- [ ] IM Form lifecycle (Epic 9)
- [ ] Exchange rate snapshots (Epic 14.2)

**Quality**
- [ ] Marketing site polish (Epic 28.1–28.4)
- [ ] Auth forms bilingual + labeled (Epic 25.2, 26.1)
- [ ] Mobile responsive (Epic 27.1)
- [ ] Coverage gate in CI (Epic 31.1)
- [ ] Staging environment (Epic 32.3)

**Ops**
- [ ] Runbook for incident response
- [ ] Backup & restore tested
- [ ] DR plan documented
- [ ] On-call rotation defined

---

*Generated from full-codebase audit, 2026-04-24. Keep this doc current — every shipped story closes a risk.*
