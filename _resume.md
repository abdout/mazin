# Mazin Automation Roadmap — Resume Tracker

> Pick this up here. Phase 1 is shipped (17 stories, 1135 tests green, lint + type clean).
> Phase 2 is in progress and paused at **Story 0.1** while AWS infrastructure is being provisioned.

Full plan with story acceptance criteria: `/Users/abdout/.claude/plans/we-want-to-ship-partitioned-wren.md`

---

## ▶ Resume here — Story 0.1 (S3 + CloudFront file storage)

Code is written, schema updated, env wired, tests authored. Nothing has called AWS yet, so nothing to roll back. Implementation paused waiting for AWS bucket + CloudFront distribution.

### Required env (operator provisions, then we resume)

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=mazin-prod
CLOUDFRONT_DOMAIN=dXXX.cloudfront.net
# Optional (only if used)
CLOUDFRONT_DISTRIBUTION_ID=...           # cache invalidation on overwrite
CLOUDFRONT_KEY_PAIR_ID=...               # signed URLs for private invoices/POD
CLOUDFRONT_PRIVATE_KEY="-----BEGIN ..."  # PEM, multi-line via \n in CI
```

### Bucket / distribution recommendations

- Block all public access at the bucket level; serve through CloudFront with **Origin Access Control** (OAC).
- IAM user permissions: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket` on the bucket only.
- CloudFront cache: `image/*` 1y, `application/pdf` 1d. The upload action sets `Cache-Control: public, max-age=31536000, immutable` and uses a unique S3 key per upload, so long TTL is safe.
- CORS on the bucket: allow `GET` from your app origin. (`PUT` only matters if presigned-PUT is later added.)

### Resume checklist

```markdown
- [ ] Provision S3 bucket (block public access, OAC for CloudFront)
- [ ] Provision CloudFront distribution with OAC origin
- [ ] (optional) CloudFront key-pair → CLOUDFRONT_KEY_PAIR_ID + CLOUDFRONT_PRIVATE_KEY
- [ ] (optional) CLOUDFRONT_DISTRIBUTION_ID for invalidation
- [ ] Populate `.env` with the 8 AWS_*/CLOUDFRONT_* keys
- [ ] `pnpm db:push` — sync FileRecord + FileAccess enum
- [ ] `pnpm vitest run src/__tests__/lib/storage/` — storage tests green
- [ ] `pnpm vitest run` — full suite green
- [ ] `pnpm tsc --noEmit` — clean
- [ ] Wire `uploadShipmentDocument` into the project docs page UI (drag-drop)
- [ ] Smoke test: upload a real PDF → verify in S3 + ShipmentDocument row
- [ ] Re-run `pnpm lint` — no new warnings
```

### Files already staged for Story 0.1 (in working tree, uncommitted)

| Path | Type |
|---|---|
| `src/lib/storage/cloudfront-url.ts` | new — zero-SDK URL helpers |
| `src/lib/storage/cloudfront.ts` | new — signed URLs + invalidation |
| `src/lib/storage/s3-client.ts` | new — lazy S3Client + bucket helpers |
| `src/lib/storage/config.ts` | new — Mazin-tuned MIME + size + folder per `UploadKind` |
| `src/lib/storage/upload.ts` | new — `uploadFile`, `deleteFile`, `findFileByUrl` (SHA-256 dedupe + activity event) |
| `src/actions/shipment-document.ts` | extended — `uploadShipmentDocument(formData)` |
| `prisma/models/operations.prisma` | added `FileRecord` + `FileAccess` enum |
| `prisma/models/auth.prisma` | added `User.fileRecords[]` |
| `src/lib/env.ts` | added 8 storage env vars |
| `.env.example` | added 8 vars with explanations |
| `next.config.ts` | extended `images.remotePatterns` + CSP `img-src`/`connect-src` |
| `package.json` | + `@aws-sdk/{client-s3, s3-request-presigner, cloudfront-signer, client-cloudfront}` |
| `src/__tests__/setup.ts` | mock `db.fileRecord` |
| `src/__tests__/lib/storage/{cloudfront-url, config, upload}.test.ts` | new (~20 cases) |

---

## ✅ Phase 1 — Done

| # | Story | Outcome |
|---|---|---|
| 0.4 | JobRun idempotency + Notification.dedupKey | Crons safe to retry; demurrage + reminders wrapped |
| 3.5 | Reference-number validators | BL, ACN, ISO 6346 container, manifest, IM, declaration — Zod-wired |
| 12.5 | ShipmentEvent activity feed | Model + helper + wired into tracking, payment, doc upload |
| 8.5 | Enforce `publicTrackingEnabled` | `getPublicTracking` returns null when disabled |
| 14.6 | Statement of Account: payments side | Was always 0 credits; now real running balance |
| 14.10 | CustomsPayment ↔ Invoice FK | Profit calc + traceability foundation |
| 6.3 | Profit margin per shipment | `getShipmentProfit` + `getClientProfit` server actions |
| 3.3 | Replaced stale `/duty` widget | Server-action HS autocomplete, FX-aware |
| 4.3 | Container ISO 6346 + status sync | Auto-flip RELEASED on stage advance |
| 12.1 | Real team roster | Replaced mockTeamMembers; `MEMBER → CLERK` reconciled |
| 2.1 | IM Form expiry alerts | 10/5/3/1/0/overdue + auto-EXPIRED |
| 2.4 | Mandatory document checklist | Gate on advanceToNextStage |
| 4.2 | Stage SLA breach detection | Warn at 1×, breach at 2× |
| 14.5 | Invoice reminder schedule | -7d/-1d/due/+3d/+7d/+14d/+30d + auto-OVERDUE |
| 8.1 | 11-stage WhatsApp parity | 13 new templates + per-type map |
| 10.1 | Today cockpit (v1) | Stuck shipments, payments due, new leads |
| 10.3 | Compliance reminders panel | IM + ACD + D/O + stage SLA, sorted worst-first |

---

## 🚧 Phase 2 — In progress (after Story 0.1 unblocks)

### Foundation
- [ ] **0.1** S3 + CloudFront storage — *paused, see top of file*
- [ ] **0.2** Inbound WhatsApp webhook (`/api/whatsapp/webhook`)
- [ ] **0.3** Client portal authentication (phone OTP via WhatsApp; new `OtpToken` model + `(client-portal)` route group)

### Smart declaration
- [ ] **3.1** Sudan tariff book seed — ≥500 `HsCode` rows + new `ssmoRequired Boolean @default(false)`
- [ ] **3.2** HS code suggestion in declaration form (uses 3.1 + existing OCR)

### Communications
- [ ] **8.3** Email channel completion — Resend wired into `dispatchNotification`, React Email templates per stage
- [ ] **8.6** Public tracking real-time SSE + payment-due indicator + tokenized "Pay now" link

### PDF generation
- [ ] **9.1** PDF infrastructure — `@react-pdf/renderer` + Cairo font (Arabic bidi)
- [ ] **9.2** Clearance invoice generator — assembles from shipment data per `knowledge.md` §4.7

### Cockpit
- [ ] **10.4** Daily ops digest (cron 7 AM, WhatsApp + email morning summary)

### Team operations
- [ ] **12.2** Project lifecycle hardening — replace `team String[]` with `ProjectAssignee` join; add `ARCHIVED` enum + status transition guards
- [ ] **12.3** Task assignees join + `TaskComment` + `Task.parentId` (sub-tasks)
- [ ] **12.4** Timesheet ↔ task link — FK `taskId/projectId/shipmentId`; new `clockIn(taskId)`/`clockOut()` actions; reject flow

### Invoice excellence
- [ ] **14.1** Receipt upload → OCR → auto-match → flip Invoice.status=PAID (uses 0.1 + existing `extractReceipt`)
- [ ] **14.4** Auto-send invoice on create — `BillingPreferences` model + `invoice_sent` Cloud API template (replaces wa.me link)
- [ ] **14.7** AR aging + collections dashboard (0-30/31-60/61-90/90+ buckets, DSO, top debtors)
- [ ] **14.8** Wallet activation — top-up/withdraw/credit notes; new `CreditNote` model

---

## 📦 Phase 3 — Core A-to-Z (Weeks 8–13)

### Lead-to-quote funnel
- [ ] **1.1** Public inquiry form `/[lang]/inquiry` (Turnstile, rate-limited, creates `Client { status:'LEAD' }`)
- [ ] **1.2** Proforma OCR auto-fill — new `ProformaInvoice` model; populates IMForm + declaration draft
- [ ] **1.3** Auto-quotation from `FeeTemplate` (bilingual PDF, 7-day validity, accept→Project+Shipment)
- [ ] **1.4** Lead aging cron (24h follow-up, 7d cold, weekly digest)

### Pre-shipment compliance
- [ ] **2.2** ACD bundle generator (Draft B/L + Commercial Invoice + Freight Invoice + declarant cover; T-7d/T-3d/T-1d alerts)
- [ ] **2.3** ACN cross-validation — BL OCR `acnNumber` vs `AdvanceCargoDeclaration.acnNumber`; container number diff vs `Container[]`; new `ComplianceFinding` model

### Multi-party payments
- [ ] **6.1** Per-shipment payment plan board (8 payees, blocks RELEASE if customs/port/shipping unpaid)
- [ ] **6.2** Bank screenshot OCR matching (uses 14.1 plumbing)
- [ ] **6.4** Cashflow aging dashboard (per-payee buckets, weekly Sunday digest)
- [ ] **6.5** Recurring fee templates per client/route (`ClientFeeOverride` model)

### Release & delivery
- [ ] **7.1** D/O OCR expiry capture — new `extractDeliveryOrder`; alerts T-12h/T-3h/expired
- [ ] **8.2** WhatsApp inbound auto-attach (delivered as Story 0.2 surface)
- [ ] **8.4** Client self-serve portal `/portal/{dashboard,shipments,invoices,documents}` (uses 0.3)

### Bilingual PDFs
- [ ] **9.3** Statement of Account auto-rebuild (1st-of-month cron, persistent `Client.openingBalance`)
- [ ] **9.4** IM Form application PDF (bilingual, ready-for-print)
- [ ] **9.5** ACD cover sheet (declarant info, license 276)
- [ ] **9.6** Customs declaration draft form (Form 11 / Single Window mirror)
- [ ] **9.7** Claim letters & SSMO release request templates

### Team + messaging
- [ ] **12.6** Daily standup `/today` view (per-team-member columns, manager + clerk views)
- [ ] **12.7** Auto-task generation from project events (extend `TaskAssignmentRule` + `triggerStage`)
- [ ] **13.1** Messaging schema (lift trimmed subset from `~/hogwarts/prisma/models/messages.prisma`)
- [ ] **13.2** Chat UI (lift from `~/hogwarts/src/components/school-dashboard/messaging/`, polling-only, no Socket.IO)
- [ ] **13.3** Shipment-anchored threads (auto-create `Conversation { type: SHIPMENT_THREAD }` on shipment create)

### Money collection
- [ ] **14.2** Payment provider router (lift `~/hogwarts/src/lib/payment/*`; activate Bankak, MPESA_SUDAN, BANK_TRANSFER, CASH, plus Stripe/Tap for non-SDG)
- [ ] **14.3** Online payment + tokenized public link `/[lang]/pay/[token]` (signed, single-invoice, 30d)
- [ ] **14.9** Bank statement CSV import (Bankak/Faisal/Khartoum parsers; auto-reconcile vs `Payment.providerRef` / `Invoice.referenceNumber`)

---

## 🚀 Phase 4 — Strategic (Q2)

### Smart declaration (deeper)
- [ ] **3.4** ASYCUDA / Single Window payload generator (`SingleWindowPayload` JSON/XML per `knowledge.md` §5.1)

### In-transit visibility
- [ ] **4.1** Vessel tracking adapter (MarineTraffic / VesselFinder; daily ETA polling; `IntegrationCredential` model)

### Field operations (PWA)
- [ ] **5.1** PWA shell + service worker (manifest, A2HS, offline-readable last-synced data)
- [ ] **5.2** Mobile inspection — `InspectionRecord` model, photo + GPS + IndexedDB queue + reconnect sync
- [ ] **5.3** SSMO release model + lab sample lifecycle + `HsCode.ssmoRequired` auto-trigger

### Last-mile
- [ ] **7.2** Marketplace dispatch (truck vendor → `ServiceRequest`; new `ServiceRequest.shipmentId` FK; vendor WA accept/decline)
- [ ] **7.3** Proof of Delivery — new `ProofOfDelivery` model; photo + signature + GPS at consignee
- [ ] **7.4** Recurring labor templates per route (default `MANPOWER` ServiceListing per route+container)

### Analytics
- [ ] **10.2** KPI dashboard (avg clearance time, p50/p90 per stage, profit per shipment/client, bottleneck heatmap, CSV export)

### AI assistant
- [ ] **11.1** Conversational shipments query (Anthropic tool-use over `Shipment` + `ShipmentPayment` + `TrackingStage`; bilingual)
- [ ] **11.2** Auto-summarize shipment (3-bullet brief, cached 1h)
- [ ] **11.3** Anomaly detection (price > 2σ, duty rate > 95th percentile, delay > 3σ)

### Messaging extensions
- [ ] **13.4** Chat file attachments via S3 (uses 0.1 storage layer)
- [ ] **13.5** Notifications integration for messages (`MESSAGE_RECEIVED`, `MENTIONED_IN_MESSAGE`)

---

## ✅ Verification milestones (per phase)

### After Phase 2 close (smoke test)
- Upload a real Proforma → OCR populates IMForm + declaration line items
- Hit inbound WhatsApp webhook with a fixture → doc auto-attaches to client's open shipment
- Client logs in via WhatsApp OTP → sees their shipment
- Run HsCode seed → declaration form suggests 3 codes + rates pre-fill
- Generate clearance invoice PDF → matches a real Mazin invoice from `/Users/abdout/mazin/PDF-1.pdf`
- Drop a bank screenshot → auto-match flips an invoice to PAID
- Open `/team` → real users render (no mock data)
- Public `/track/[trackingNumber]` with `publicTrackingEnabled=false` → 404

### After Phase 3 close
- Submit `/[lang]/inquiry` → lead → quotation auto-emailed → accept → Project + Shipment exist
- Bank screenshot upload matches a `ShipmentPayment` row
- Payment plan board greens up for fully-paid shipment, blocks RELEASE for partial
- ACD bundle PDF downloadable + ACN cover correct
- `/[lang]/pay/[token]` → pay USD via Stripe sandbox → webhook flips status → `payment_received` WhatsApp arrives
- Bankak sandbox SDG path works
- `/[lang]/(platform)/messages` → start thread, attach file, mention teammate, badge increments
- `/today` shows real per-team-member queue
- Clock-in on a task, clock-out → `TimesheetEntry` rows + `Task.timeSpentMinutes` updated

### After Phase 4 close
- Vessel adapter populates ETA → demurrage countdown re-syncs
- Mobile inspection: airplane-mode capture → re-online sync → photos in S3
- AI chatbot answers "where is shipment GGZ2339767?" with stage + days-elapsed
- KPI dashboard renders profit-per-client + bottleneck heatmap on real data

---

## Hogwarts patterns to lift (single-tenant adapted)

| Source path | Used by | Status |
|---|---|---|
| `~/hogwarts/src/components/file/providers/{aws-s3,factory,base}.ts` | Story 0.1 | ⏸ in progress |
| `~/hogwarts/src/lib/cloudfront{,-url}.ts` | Story 0.1 | ⏸ in progress |
| `~/hogwarts/src/app/api/cron/fee-overdue/route.ts` | Story 14.5 | ✅ done |
| `~/hogwarts/src/lib/payment/*` | Story 14.2 | queued |
| `~/hogwarts/src/lib/dispatch-notification.ts` | Story 8.3 | queued |
| `~/hogwarts/src/lib/whatsapp/*` | Story 0.2 | queued |
| `~/hogwarts/prisma/models/messages.prisma` (trimmed) | Story 13.1 | queued |
| `~/hogwarts/src/components/school-dashboard/messaging/*` | Story 13.2 | queued |
| `~/hogwarts/prisma/models/finance-invoices.prisma` (`BillingPreferences`, `CreditNote`) | Stories 14.4 / 14.8 | queued |

---

## Done criteria

The roadmap is "delivered" when:

1. All ~80 stories tracked + closed (foundation 0.x + epics 1–14).
2. `AUTOMATION_GAP_ANALYSIS.md` rewritten to point at the new state.
3. Mazin uses `/today` (Story 12.6) + cockpit (Story 10.1) as his daily home for one full week without opening the legacy dashboard.
4. A real client logs in via WhatsApp OTP, pays one invoice via the public payment link, and gets a `payment_received` WhatsApp.
5. Mazin's office completes one full clearance lifecycle (lead → invoice → paid → archive) without a single phone call to dictate status.
