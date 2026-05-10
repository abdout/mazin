# Mazin Performance Audit (Next 16 / React 19)

Stack: Next 16.2.4, React 19.2.5, Prisma 7.7 with `@prisma/adapter-neon`, Auth.js v5-beta, Tailwind 4. 55 platform pages, 538 .tsx files, 48 with `'use client'`.

## 1. Waterfalls — top 5 in `src/app/[lang]/(platform)/**/page.tsx`

All five do sequential `await` where the calls are independent:

1. **`/project/[id]/invoices/page.tsx:80-93`** — 6 sequential awaits (`params` → `searchParams` → `dict` → `auth` → `project` → `invoices`). The `auth()` and `project lookup` are independent of `dict`.
2. **`/project/[id]/payments/page.tsx:101-107`** — `await params` → `await getDictionary(locale)` → `await getProject(id)`. Dictionary and project don't depend on each other.
3. **`/project/[id]/report/page.tsx:48-68`** — `params` → `dict` → `auth` → `project` (4 sequential).
4. **`/project/[id]/acd/page.tsx:14-34`** — `params` → `dict` → `auth` → `project`.
5. **`/project/[id]/docs/page.tsx:95-100`** + **`:158`** — `params` → `dict` → `getProject` → `initializeDocumentChecklist` → `getDocumentChecklist`.

Honorable mentions: `/project/[id]/itp/page.tsx:16-21`, `/project/[id]/mos/page.tsx:16-21`, `/project/[id]/page.tsx:13-16`, `/project/[id]/containers/page.tsx:131-138`, `/marketplace/[serviceId]/page.tsx:13-17`, `/finance/receipt/manage-plan/page.tsx:34-44`.

Inside server actions, the worst is **`src/components/platform/dashboard/compliance-actions.ts:34-156`**: 4 sequential `findMany` (imForms, acds, dos, inProgress stages) all independent — should be one `Promise.all` for ~4× speedup on the dashboard panel.

Also **`src/components/platform/dashboard/actions.ts:557-611`** (`getTrendingStatsData`): two `Promise.all`s plus a final `await db.customsDeclaration.count` — all independent, could be a single 9-promise `Promise.all`.

## 2. Barrel imports

- 115 files import from `'lucide-react'` directly. Good (no barrel `@/components` re-export). However, **`next.config.ts` has no `experimental.optimizePackageImports`** for `lucide-react`, `@iconify/react`, `recharts`, `framer-motion`, `date-fns`, `react-icons`, `@react-pdf/renderer`.
- `@tabler/icons-react`: **0 usages** (still in `package.json` line 67 of dependencies — dead dep).
- `framer-motion`: 7 files — fine, but mixed with `motion/react` (`src/components/marketing/services.tsx:7`). Two animation libs effectively duplicate the runtime. Pick one.
- `@react-three/*`: only `src/components/marketing/gas/container-3d.tsx`.

No `from "@/components"` or `from "@/components/ui"` barrels exist — good.

## 3. Three.js / R3F

- Used in **`src/components/marketing/gas/container-3d.tsx:4,12`** (only place).
- Properly **dynamic-loaded via `next/dynamic` in `src/components/marketing/gas/index.tsx:8-18`** with `ssr: false` and a spinner fallback. Three.js does not enter the marketing initial bundle.

## 4. Recharts / xlsx / @react-pdf/renderer

- **`xlsx`** — dynamic-imported on click in `src/components/export/index.tsx:198-199` (`const XLSX = await import("xlsx")`). Good.
- **`@react-pdf/renderer`** — only imported from server-only API routes (`src/app/api/invoice/[id]/pdf/route.ts:2`, `src/app/api/statement/[id]/pdf/route.ts:2`) and from PDF-component files. Stays out of the client bundle. Good.
- **`recharts`** — partially dynamic:
  - Dashboard admin: `src/components/platform/dashboard/admin-client.tsx:10-13` dynamic-loads `FinanceOverview` (which holds recharts).
  - **BUT** `src/components/platform/finance/dashboard/content.tsx:19-23` directly statically imports `CashFlowChart`, `ExpenseChart`, `RevenueChart` — all of which `import { ... } from "recharts"`. The `/[lang]/(platform)/finance/dashboard` page therefore ships recharts in its initial JS.
  - Login (`/[lang]/(auth)/login/page.tsx`) and marketing (`src/app/[lang]/page.tsx`) do NOT pull recharts — confirmed clean.

## 5. `'use client'` overuse

- 48 client files / 538 total `.tsx` (~9%) — overall fine, but marketing is 14/17 and contains pure-render components.
- Concrete bad picks:
  1. **`src/components/marketing/footer.tsx:1`** — `'use client'` for a pure markup component (no hooks, no events).
  2. **`src/components/marketing/board.tsx:1`** — pure `<Image>` renderer, no interactivity.
  3. **`src/components/marketing/faq.tsx:1`** — uses Radix Accordion which manages its own client state; the wrapper itself doesn't need `'use client'`. Move the Accordion island into a child.
  4. **`src/components/marketing/ready-to-build.tsx:1`** — pure render with `<OptimizedImage>`.
  5. **`src/components/marketing/insights.tsx:1`** — only reason is `framer-motion`; if you keep motion, isolate it to a small `MotionCard` child and keep the section a server component.

## 6. Image optimization

Three raw `<img>` violations:
- `src/components/platform/task/column.tsx:19,27` — placeholder Unsplash team avatars hard-coded with `<img src="https://images.unsplash.com/...">`. Replace with `next/image` and add the host to `next.config.ts:8` (already there).
- `src/components/platform/finance/receipt/receipt-detail.tsx:185` — `<img src={receipt.fileUrl} />` for an S3 receipt blob. Replace with `next/image` (S3/CloudFront hosts already in `next.config.ts:9-13`).

`src/components/marketing/partners.tsx:24` uses `next/image` with `unoptimized` — acceptable for SVG logos but PNG sponsors should be served through the optimizer.

## 7. Server-action N+1 candidates

1. **`src/actions/profit.ts:120-129`** (`getClientProfit`) — `db.shipment.findMany` then `Promise.all(shipments.map(s => getShipmentProfit(s.id)))`. Each `getShipmentProfit` runs **3 queries** (`profit.ts:65-88`). For 50 client shipments = **150 queries per call**. Fix: collapse into one batched aggregation by `shipmentId`.
2. **`src/actions/container.ts:107-138`** (`bulkCreateContainers`) — sequential `await db.container.create` inside a `for` loop. Use `db.container.createMany({ data: [...] })` (or transaction) instead. Same shape exists in **`container.ts:266`** for an update loop and **`document-extraction.ts:132`**.
3. **`src/components/platform/dashboard/cockpit-actions.ts:24-55`** (`getStuckShipments`) and **compliance-actions.ts:34-156`** — each pulls `findMany` of stages/imForms/acds/dos plus an embedded `shipment: { select: ... }`. Not strictly N+1 (Prisma joins them in one query) but they are 4 sequential calls; combine via `Promise.all`.

## 8. Indexed queries — coverage gaps

Schema has 169 `@@index` annotations across the model files, generally aligned with where-clauses. Verified critical paths:

- **Customer list** `Client.findMany({ where: { userId, companyName: { contains, mode: 'insensitive' } } }, orderBy: { createdAt: 'desc' })` — `@@index([userId])` and `@@index([companyName])` exist on `Client`, but `contains + mode: insensitive` is `ILIKE %x%` which does **not use a btree index**. Needs `pg_trgm GIN index` or pre-lowercased columns. Same issue for `email`, `contactName` (no index) on the same query at `src/components/platform/customer/_table/queries.ts:29-37`.
- **Shipments list** `listShipments` (`src/components/platform/shipments/actions.ts:30-71`) sorts by `createdAt desc` — covered by `@@index([createdAt])`. But the `OR` `contains insensitive` search across 5 columns at lines 47-53 hits no index. Not indexed: `consignee`, `consignor`, `vesselName`.
- **Dashboard** queries filter by `userId, status` and `userId, createdAt: { gte }`. There's no compound `@@index([userId, status])` or `@@index([userId, createdAt])` on `Shipment` — Postgres can use either single-column index, but multi-tenant + time-bound queries beg compound indexes.
- **Demurrage** `src/actions/demurrage.ts:142-163` filters by `demurrageStartDate: { not: null }` and orders by `demurrageStartDate asc` — there is **no `@@index([demurrageStartDate])`**. Same for `Shipment.arrivalDate`, used in detail pages.

## 9. `select` vs `include` discipline

Mixed. Bad offenders that over-fetch:

- **`src/components/platform/project/actions.ts` `getProject`** uses `include: { tasks: true, shipment: { include: { trackingStages: ..., stageInvoices: { include: { invoice: true } } } }, client: true }`. No selects. Every page that calls `getProject` (project detail, payments, invoices, docs, ITP, MOS, containers, ACD, report) drags this kitchen-sink payload.
- **`src/components/platform/shipments/actions.ts:73-90` `getShipment`** uses `include` for client, project, trackingStages, declarations, acds, invoices, containers, documents — entire rows.
- **`src/components/platform/marketplace/actions.ts:212-228`** (`getVendors`) `include: { services: { ... }, _count: ... }` returns full vendor row.
- **`src/components/platform/customer/_table/queries.ts:74-78`** uses `include: { invoices: { select: { id: true } } }`. `invoices` array of objects just to count — replace with `_count: { select: { invoices: true } }`.

Good patterns (keep): `cockpit-actions.ts` uses `select:` with specific fields. `dashboard/actions.ts:506-516` (recent transactions) uses `select`.

## 10. Streaming / Suspense

- `loading.tsx` exists for **27 platform pages** including dashboard, shipments, customs, marketplace, project, team, task, finance, customer, invoice, settings (top-level).
- **Missing** `loading.tsx`:
  - `(platform)/settings/organization/page.tsx`
  - `(platform)/settings/security/page.tsx`
  - `(platform)/settings/integrations/page.tsx`
  - `(platform)/settings/team/page.tsx`
  - `(platform)/settings/notifications/page.tsx`
  - `(platform)/shipments/new/page.tsx`
  - `(platform)/shipments/[id]/page.tsx`
  - `(platform)/project/[id]/payments/page.tsx`
  - All sub-pages under `/finance/*` (banking, payroll, reports, accounts, wallet, timesheet, budget, expenses, fees, salary, receipt) — most have `metadata` but no `loading.tsx`.
- Suspense usage is partial: customer/invoice/banking pages wrap in `<Suspense>`, but dashboard/page.tsx blocks on `Promise.all` of 8 server actions before any render. The cockpit + DemurrageAlerts + CompliancePanel are inline, not Suspense-wrapped, so the initial paint waits for the slowest sub-action.

## 11. `next/font`

- `src/app/[lang]/layout.tsx:4` imports **`fontSans` and `fontRubik` from `@/components/atom/fonts`**, which uses **`next/font/google`** for Geist Sans, Geist Mono, and Rubik (`src/components/atom/fonts.ts:1-28`). Good — modern path.
- `display: 'swap'` only set on Rubik; Geist defaults are fine but explicit is better.
- **No Cairo font is configured.** Arabic text uses `Rubik` (which has `subsets: ["latin", "arabic"]`). Rubik supports Arabic; if the design wants Cairo specifically, it's missing.
- Dead duplicate: `src/components/table/lib/fonts.ts:1-5` imports `geist/font/{sans,mono}` from the **older `geist` npm package** (`package.json` line 70). Not imported anywhere — pure dead weight in node_modules. Drop the `geist` dependency.

## 12. Edge runtime + Prisma

- `auth.ts:12` declares `runtime = 'nodejs'` (correct — Auth.js uses Node APIs).
- Cron routes `api/cron/demurrage/route.ts:8` and `api/cron/reminders/route.ts:22` declare `runtime = 'nodejs'`.
- **No route declares `runtime = 'edge'`** while using Prisma. Good.
- `src/lib/db.ts` already wires `@prisma/adapter-neon` with WebSocket driver — fully edge-capable should you need it.

## 13. Bundle analyzer

- `package.json` does not list `@next/bundle-analyzer`. `next.config.ts` has only image hosts, security headers, and Sentry config. No analyzer wrap. **Cannot answer "what's in the bundle" without adding it.** Recommend adding in dev only.

---

## Priority list

### P0 — ship-blocking perf

- **`src/components/platform/finance/dashboard/content.tsx:19-23`**: dynamic-import `RevenueChart`, `CashFlowChart`, `ExpenseChart`. Right now finance dashboard ships ~150-200 KB of recharts in the initial bundle.
- **`src/actions/profit.ts:120-129` `getClientProfit`**: rewrite as a single aggregation query. Today's pattern is O(N) round-trips × 3.
- **`src/components/platform/dashboard/compliance-actions.ts:34-156`**: collapse the 4 sequential `findMany` into one `Promise.all`.
- **`src/components/platform/project/actions.ts` `getProject`**: replace `include` with field-level `select`. Every project sub-page (8+) drags the full graph today.
- **`src/lib/db.ts`** + **`src/components/platform/finance/dashboard/actions.ts:36-98`**: `getDashboardStats` filters expenses, shipments, bankAccounts, payrolls without a `userId` scope — multi-tenant data leak AND no index hits. Add `userId` (and a compound `@@index([userId, createdAt])` on the relevant models).

### P1 — meaningful wins

- Add **`experimental.optimizePackageImports: ['lucide-react', '@iconify/react', 'recharts', 'framer-motion', 'date-fns', 'react-icons', '@react-pdf/renderer']`** to `next.config.ts`.
- Convert sequential awaits to `Promise.all` in the 5 page.tsx waterfalls listed in #1 (especially `/project/[id]/invoices/page.tsx`, `/project/[id]/report/page.tsx`, `/project/[id]/acd/page.tsx`).
- **`src/actions/container.ts:107-138`**: replace the for-loop creates with `db.container.createMany`. Same in `container.ts:266` and `document-extraction.ts:132`.
- Add **pg_trgm GIN indexes** for ILIKE search columns: `clients.companyName`, `clients.contactName`, `shipments.shipmentNumber/trackingNumber/consignee/consignor/vesselName`, `invoices.invoiceNumber`. (Pure-prefix searches can use `text_pattern_ops` btree if you anchor with `startsWith`.)
- Add `@@index([userId, createdAt])` compound on Shipment, Invoice, Expense, Project for "user's recent X" queries.
- Add `@@index([demurrageStartDate])` on Shipment.
- **`src/components/platform/customer/_table/queries.ts:74-78`**: `include: { invoices: { select: { id: true } } }` → `_count: { select: { invoices: true } }`.
- Replace raw `<img>` with `next/image` at `src/components/platform/task/column.tsx:19,27` and `src/components/platform/finance/receipt/receipt-detail.tsx:185`.
- Drop the `geist` package and `src/components/table/lib/fonts.ts` (dead).
- Drop `@tabler/icons-react` from `package.json` (zero usages).
- Standardize on one of `framer-motion` vs `motion` — currently both ship.

### P2 — polish

- Add `loading.tsx` for the 11 missing pages (settings/*, shipments/new, shipments/[id], project/[id]/payments, finance/*).
- Wrap dashboard sub-panels (`TodayCockpit`, `DemurrageAlerts`, `CompliancePanel`) in `<Suspense>` with skeletons in `src/app/[lang]/(platform)/dashboard/page.tsx:55-72` so they stream independently.
- Move `'use client'` off `marketing/footer.tsx`, `marketing/board.tsx`, `marketing/ready-to-build.tsx`, `marketing/faq.tsx` (push the Accordion island into a child).
- Add `@next/bundle-analyzer` to `next.config.ts` behind `process.env.ANALYZE`.
- Consider a `unstable_cache` wrapper around `getDictionary` (it's called on every page request, twice per page in some).
- Add `display: 'swap'` to the Geist font config in `src/components/atom/fonts.ts:7-15`.
