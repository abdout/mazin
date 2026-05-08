# Mazin Test Coverage Audit — Production Readiness

## 1. Test Counts & Structure

- **Unit test files:** **92** (`find src/__tests__ -name "*.test.ts*" | wc -l`)
- **Counted `it(`/`test(` calls:** ~**1003** in unit tests + **42** in Playwright = ~1045 — close to but not exactly the "1135" claim (within rounding for `describe.each` / `it.each` expansion)
- **E2E spec files:** **12** under `/Users/abdout/mazin/tests/e2e/`
- **Test directories:** auth, shipments, customs, marketplace, invoice, jobs, services, validation, components, hooks, actions/{tracking, invoice, im-form, acd, demurrage, container, exchange-rate, duty-calculator, shipment-payment, shipment-document, document-extraction, notifications, report-issue}, lib/{storage, tracking, validation}, i18n, finance, settings, helpers, utils, middleware

## 2. Vitest Config (`vitest.config.ts`)

- jsdom env, globals on, setup at `src/__tests__/setup.ts:1`
- Coverage provider `v8`; **no `thresholds` block** (`vitest.config.ts:13-23`) — coverage is collected but **not gated**.

## 3. Playwright Config (`playwright.config.ts`)

- 6 projects: setup, public, auth-flows, platform-en, platform-ar (filtered to `@i18n|@smoke`), responsive
- Workers = 1, fullyParallel = false (slow)
- Auth setup logs in `mazin@abdout.org`/`1234` programmatically and stores `tests/e2e/.auth/admin.json`

## 4. Critical Path Coverage Matrix

| Path | Unit | E2E | Verdict |
|---|---|---|---|
| Login (email+pwd) | `src/__tests__/auth/actions.test.ts` (no direct `signIn` test) | `tests/e2e/auth/login.spec.ts:4-44` 6 tests | ✅ |
| Registration | `src/__tests__/auth/register.test.ts:1-168` (mocked DB) | `tests/e2e/auth/register.spec.ts:3-8` (renders only) | ⚠ E2E doesn't actually submit |
| Password reset | `src/__tests__/auth/actions.test.ts:78-157` (`reset` + `newPassword`) | `tests/e2e/auth/register.spec.ts:10-19` (renders only) | ⚠ no E2E happy path |
| **Public tracking + `publicTrackingEnabled` toggle** | `src/__tests__/actions/tracking/public-tracking.test.ts:107-116` | `tests/e2e/public/tracking.spec.ts:1-25` | ✅ both |
| `advanceToNextStage` notifications | `src/__tests__/actions/tracking/advance-stage.test.ts:73-126` | none | ⚠ unit only — and `notifyShipmentMilestone` is **mocked** (`advance-stage.test.ts:5-7`), so notification dispatch is **never asserted** |
| Container demurrage countdown | `src/__tests__/shipments/demurrage.test.ts:1-53`, `src/__tests__/actions/demurrage/demurrage-actions.test.ts` | none | ✅ unit |
| IM Form expiry alerts | `src/__tests__/actions/im-form/im-form.test.ts:168-176` (1 test asserts updateMany) | none | ⚠ thin |
| HS code lookup / duty | `src/__tests__/customs/duty-calculation.test.ts:1-58`, `src/__tests__/actions/duty-calculator/duty-calculator.test.ts` | none | ✅ unit |
| Invoice creation | `src/__tests__/actions/invoice/create-invoice.test.ts:1-151` (5 tests, all mocked DB) | `tests/e2e/platform/invoice.spec.ts:11` (page loads only — no submit) | ⚠ no real-DB or full-flow |
| Receipt OCR | `src/__tests__/actions/document-extraction/document-extraction.test.ts:66-70` (1 dispatch test for `RECEIPT`); the actual `extractReceipt` AI call is mocked at line 13 | none | ⚠ thin |
| Cron idempotency `JobRun` | `src/__tests__/jobs/lock.test.ts:1-83` | none | ✅ |
| **Multi-tenant isolation** | **NONE.** `src/__tests__/lib/tenant-context.test.ts:1-62` only checks `auth()` returns user/null. The schema has no `tenantId`/`companyId`/`organizationId` field on `User` (`grep -rn "tenantId" prisma/models/auth.prisma` returns nothing). | none | 🔴 **No multi-tenant model exists** — claim is moot, but no test asserts row-level isolation either |
| Webhook verification — WhatsApp | `src/__tests__/services/whatsapp.test.ts:327-367` (4 tests, sha256 HMAC) | none | ✅ |
| Webhook verification — Sentry | none. Sentry is integration only (`@sentry/nextjs` SDK), no inbound webhook route. | none | ✅ N/A |
| **Cron route auth (`CRON_SECRET`)** | NONE — `verifySecret` in `src/app/api/cron/demurrage/route.ts:18-25` and `src/app/api/cron/reminders/route.ts:30+` is **never tested** (`grep -rn "CRON_SECRET\|verifySecret" src/__tests__` → 0 hits) | none | 🔴 **gap** |

## 5. Tautology / Mock Audit — 5 random server-action tests

All five tests sampled mock `@/lib/db` via the global setup at `src/__tests__/setup.ts:38-167`. Every Prisma model is replaced with `vi.fn()`s. **There is no real DB / testcontainers / sqlite.** The `$transaction` mock at line 157-162 simply re-invokes the callback with the mock object.

| File | Mocks | Real coverage |
|---|---|---|
| `src/__tests__/actions/invoice/create-invoice.test.ts:1-151` | `db`, `auth`, `next/cache`, `arabic-numbers` | Pure logic — verifies the shape of `db.invoice.create({data})` arg |
| `src/__tests__/actions/tracking/advance-stage.test.ts:1-170` | `db`, `auth`, `next/cache`, `notifyShipmentMilestone`, **all of `@/lib/tracking`** at line 8-30 | Tests the action calls `db.trackingStage.update` with the right where-clause. Because `notifyShipmentMilestone` is mocked, **whether a notification is actually emitted is untested** |
| `src/__tests__/actions/im-form/im-form.test.ts:1-177` | `db`, `auth`, `next/cache` | Tests Zod input validation and that `db.iMForm.update.data.status` is `EXPIRED`/`VALUE_MISMATCH`. **Date math against system clock not asserted** |
| `src/__tests__/actions/duty-calculator/duty-calculator.test.ts:1-80` | `db.hsCode`, `auth` | Tests the lookup chain; HS-code seed data not used |
| `src/__tests__/actions/document-extraction/document-extraction.test.ts:1-157` | `db`, `auth`, **all of `@/lib/services/ocr`** at line 6-13 | The OCR dispatcher is asserted but **no actual extraction is run** |

**Result:** Of the 92 unit-test files, **54 use `vi.mock("@/lib/db", …)` directly** and effectively **all 92 inherit** the global Prisma mock from `setup.ts:167`. None hit a real or in-memory DB. The pattern is "did we call `db.x.create` with the right `where`/`data` shape" — useful for catching field-rename regressions, **not for catching schema drift, FK cascades, unique-constraint races, or transaction semantics**.

## 6. CI Gates (`.github/workflows/ci.yml`)

- `pnpm type-check` — **line 41** ✅
- `pnpm lint` — **line 43** ✅
- `pnpm test` (vitest run) — **line 47** ✅
- `pnpm build` — line 49 ✅
- `pnpm test:e2e` — **line 112** ✅ (gated `if: pull_request || main`, line 61 — does **NOT** run on feature-branch pushes)
- E2E spins up Postgres 16 service (line 64-75), runs `pnpm db:push` then `pnpm build` then Playwright. **No seed step is run**, so seeded fixtures (`mazin@abdout.org`, `TRK-ABC123/XYZ789`) are absent in CI — many E2E tests will fail or skip silently in CI.

## 7. Snapshot / Visual Regression

- Zero `toMatchSnapshot` / `toMatchInlineSnapshot` test usage
- No Playwright `expect(page).toHaveScreenshot()` anywhere
- **Verdict: zero snapshot or visual-regression coverage**

## 8. Accessibility

- `grep -rn "axe\|@axe-core\|jest-axe\|toHaveNoViolations" src` returns 0 test hits
- `package.json` does **not** depend on `@axe-core/playwright`, `jest-axe`, or `@axe-core/react`
- `@testing-library/jest-dom` is loaded (`setup.ts:1`) but only provides matchers, not a11y rules
- **Verdict: zero a11y assertions**

## 9. Seed for QA — `qa@mazin.test` Test User

`prisma/seeds/auth.ts:21-40` lists three seeded users:
- `mazin@abdout.org` / `1234` (ADMIN)
- `sami@abdout.org` / `1234` (MANAGER)
- `admin@mazin.sd` / `admin123` (ADMIN)

**`qa@mazin.test` does not exist.** Confirmed by `grep -rn "qa@mazin" /Users/abdout/mazin` → only mentions in `docs/qa-report-2026-04-25.md:305,336` requesting it. **The QA report's call-out is unaddressed.**

## 10. Other Findings

- **Cron route HTTP tests missing:** `src/app/api/cron/demurrage/route.ts:18-25`, `src/app/api/cron/reminders/route.ts:30+` have no test exercising `verifySecret(request)`. A token leak / no-auth deploy would not be caught.
- **`StorageState` for E2E uses real auth path** — `tests/e2e/global.setup.ts:7-13` performs a real login against the dev server with seeded creds, so any change to seed user creds breaks all platform-en/-ar/responsive projects. Brittle.
- **Workers = 1** in `playwright.config.ts:13` → entire E2E suite is serial. Slow but expected in a single-Postgres CI service.
- **`tests/e2e/platform/*.spec.ts` are mostly route-renders** ("page loads with status < 500"). Real flows like "create shipment → advance stage → generate invoice → upload doc" are **not** tested end-to-end.
- **Demurrage cron alert thresholds** (7/3/1/0 days) in `src/app/api/cron/demurrage/route.ts:88-94` are not tested at the route level — only the underlying calculator.

---

## P0 — Production Blockers

| # | Issue | Evidence |
|---|---|---|
| P0.1 | **Cron route auth (`CRON_SECRET`) has zero test coverage.** A misconfig where `CRON_SECRET=""` deploys would be undetectable. | `src/app/api/cron/demurrage/route.ts:18-25`; `src/app/api/cron/reminders/route.ts:30+`; no test in `src/__tests__/jobs/`, `src/__tests__/middleware/`, or anywhere |
| P0.2 | **CI E2E job does not run `pnpm db:seed`.** `loginAPI(page, TEST_ADMIN)` in `tests/e2e/global.setup.ts:7` will fail because `mazin@abdout.org` doesn't exist in the freshly-pushed schema. Either E2E is failing in CI or it's silently skipping. | `.github/workflows/ci.yml:105-112` (only `db:push`, `build`, `test:e2e` — no seed) |
| P0.3 | **Real "create shipment → advance → invoice → upload doc → tracking" happy-path E2E missing.** All `tests/e2e/platform/*.spec.ts` are page-renders, not workflow tests. | `tests/e2e/platform/shipments.spec.ts:1-30`, `invoice.spec.ts:1-36` |
| P0.4 | **`qa@mazin.test` test user not seeded** despite `docs/qa-report-2026-04-25.md:305` calling it out. | `prisma/seeds/auth.ts:21-40` |

## P1 — Should Fix Before GA

| # | Issue | Evidence |
|---|---|---|
| P1.1 | **Coverage thresholds not enforced.** Vitest is configured for v8 coverage but no `thresholds` key. Coverage can silently regress. | `vitest.config.ts:13-23` |
| P1.2 | **All unit tests run against a fully-mocked Prisma.** Schema drift, FK cascades, `@@unique` collisions, and `$transaction` rollback semantics are untested. | `src/__tests__/setup.ts:38-167` (every model is `vi.fn()`); 555 grep hits for `vi.mock.*db` |
| P1.3 | **Multi-tenant isolation is unproven.** No `tenantId`/`companyId`/`organizationId` exists on the `User` model, and `tenant-context.test.ts:1-62` only checks `auth()`. The platform is effectively single-tenant. | `prisma/models/auth.prisma` — no tenant FK; `src/__tests__/lib/tenant-context.test.ts` |
| P1.4 | **`advanceToNextStage` notifications are mocked away.** Whether a stage advance actually emits a `Notification` row + WhatsApp call is never asserted end-to-end. | `src/__tests__/actions/tracking/advance-stage.test.ts:5-7` |
| P1.5 | **No accessibility tests.** Zero `axe-core`, `jest-axe`, or `@axe-core/playwright` usage. WCAG compliance is unverified. | `package.json:127-156` (no a11y deps); `grep -rn "axe" src` → 0 hits |
| P1.6 | **No visual regression tests.** No Playwright screenshots, no `toMatchSnapshot`. UI bugs (RTL flips, layout shifts) ship undetected. | `grep -rn "toHaveScreenshot\|toMatchSnapshot" tests src/__tests__` → 0 hits |
| P1.7 | **Register E2E doesn't actually register.** `tests/e2e/auth/register.spec.ts:3-8` checks the form is visible but never submits. Same for password-reset. | `tests/e2e/auth/register.spec.ts:1-19` |
| P1.8 | **Receipt OCR / extract-AI flow only tests the dispatcher.** The actual Anthropic/Groq AI call (`src/components/platform/finance/receipt/ai/extract-receipt-data.ts`) has no test. | `src/__tests__/actions/document-extraction/document-extraction.test.ts:13` mocks the entire OCR module |

## P2 — Nice to Have

| # | Issue | Evidence |
|---|---|---|
| P2.1 | E2E `workers: 1` (`playwright.config.ts:13`) → slow CI feedback. | `playwright.config.ts:13` |
| P2.2 | `tests/e2e/platform/i18n.spec.ts` only checks `dir="rtl"` for one route. No assertion that all UI strings translate. | `tests/e2e/platform/i18n.spec.ts:1-19` |
| P2.3 | Demurrage cron threshold logic (7/3/1/0 days, channel selection at line 111-112) isn't route-tested. | `src/app/api/cron/demurrage/route.ts:88-112` |
| P2.4 | Sentry is wired (`sentry.{client,edge,server}.config.ts`) but no test ensures errors flush before serverless function exits. | `sentry.client.config.ts` exists; no test |
| P2.5 | `@faker-js/faker` is used in factories, which makes some assertions non-deterministic when factory output is asserted. | `src/__tests__/helpers/factories.ts:1-80` |

---

## Verdict on the "1135 tests green" claim from `_resume.md:3`

**The number is approximately accurate (~1003 vitest cases + ~42 Playwright = ~1045, with `it.each` expansions plausibly bridging to 1135), but it is misleading as a quality signal.**

Concretely:

1. **It's a unit-test count, not a coverage metric.** Vitest has no threshold gate (`vitest.config.ts`), and CI does not publish a coverage percent.
2. **~99% of those tests run against a stub Prisma client** (`src/__tests__/setup.ts:38-167`). They verify "this server action calls `db.x.update` with this object shape" — which catches typos in field names, not bugs in business logic that depend on real DB constraints, transactions, or multi-row state.
3. **The E2E layer (42 tests) is mostly route-renders.** No real "create shipment → advance → invoice" workflow runs in CI.
4. **CI doesn't seed the DB before E2E** (`.github/workflows/ci.yml:105-112`), so the 42 Playwright tests are likely failing or skipping in CI without notice.
5. **Critical-path gaps:** `CRON_SECRET` verification, multi-tenant isolation (model itself absent), accessibility, visual regression — all zero coverage.
6. **The QA report's actionable item** (seed `qa@mazin.test`, `docs/qa-report-2026-04-25.md:305`) **was never implemented** in `prisma/seeds/auth.ts`.

A more honest summary for the resume tracker would be: *"~1000 unit tests, all against mocked Prisma; route-render E2E; lint + type-check gated; coverage threshold and a11y/visual/multi-tenant unproven."*
