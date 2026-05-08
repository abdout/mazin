# Mazin Notification & Payment Audit

Repository: `/Users/abdout/mazin`. Doc claims "Phase 1 & 2 Complete." Reality is more uneven; several P0 gaps below.

---

## 1. Notification dispatch

**Files:** `src/lib/services/notification/index.ts` (449 lines), `src/lib/services/notification/whatsapp.ts`, `src/lib/services/notification/templates.ts`, `src/lib/dispatch-notification.ts`.

**Channels supported:** `IN_APP`, `WHATSAPP`, `EMAIL` (enum present), `SMS` (enum present).

**Reality vs claim:**
- `IN_APP` works (DB row insert).
- `WHATSAPP` works via `sendWhatsAppMessage`.
- **`EMAIL` is a no-op stub** — `index.ts:115-118`: `case 'EMAIL': // Email notifications - placeholder for future / results.push({ channel, status: 'pending' });`. The reminder cron at `task-reminders.ts:537` actively requests `["IN_APP", "WHATSAPP", "EMAIL"]` for overdue invoices, which silently never sends an email.
- **`SMS` is a no-op stub** — `index.ts:120-123`.

**Failure handling:** try/catch per channel, recorded in result; final notification row gets status `SENT` if any channel succeeded (`index.ts:135-144`) — so an in-app insert masks a WhatsApp failure (status `SENT` even when WhatsApp delivery failed). The `Notification.status` column doesn't reflect per-channel failure.

**Retry / queue:** None. Delivery is in-process synchronous fetch. No queue, no retry, no backoff. If `graph.facebook.com` is slow (>10s) the server action that triggered it stalls the user request. `dispatch-notification.ts:116` does `void deliverExternal(...)` (fire-and-forget) which is better — but `deliverExternal` re-imports the same un-retried `createNotification`, and the `void`ed promise dies silently if it throws after the original request has returned.

**Two parallel implementations:** `createNotification` (legacy) and `dispatchNotification` (newer, prefs-aware). They co-exist. `dispatch-notification.ts:225` actually calls back into the legacy `createNotification`, so the new one is a wrapper, not a replacement — duplicate Notification rows are possible (one created in `dispatch-notification.ts:93`, then a second created via the inner `createNotification` call at line 227).

---

## 2. WhatsApp

**File:** `src/lib/services/notification/whatsapp.ts`.

- **Cloud API**: yes — Meta Graph API v18.0 (`whatsapp.ts:144`). Not wa.me link.
- **Phone validation**: `formatPhoneNumber` at `whatsapp.ts:63-78` is naive — strips non-digits, treats leading `0` as Sudan, returns. **Does not call `isValidSudanPhone`** from `src/lib/validation/phone.ts:67`. A 5-digit garbage string gets sent to Meta and fails server-side. The robust validator exists but is not used here. **P1.**
- **Error handling**: API errors logged, status `FAILED` written to `WhatsAppMessage` table (`whatsapp.ts:157-172`). Single attempt — no retry.
- **Template registration**: `WhatsAppTemplate` union at `whatsapp.ts:16-44` lists 27 template names. Comment claims "Names here MUST match exactly the strings registered in WhatsApp Business Manager" — there is no programmatic registration step or test that verifies these are actually approved. The `templates.ts:147-153` `WHATSAPP_TEMPLATES` map uses different names with `_ar` suffix (e.g. `task_assigned_ar`, `payment_request_ar`) that **do not match** the union in `whatsapp.ts`. Two sources of truth that disagree. **P1.**
- Hard-codes `language: { code: 'ar' }` at `whatsapp.ts:110`. English speakers receive Arabic WhatsApp templates regardless of locale. **P2.**

---

## 3. Inbound WhatsApp webhook (Story 0.2)

**Status: NOT IMPLEMENTED. P0.**

- `src/app/api/whatsapp/webhook/route.ts` does **not exist**. `find /Users/abdout/mazin/src/app/api/whatsapp` returns no matches.
- `verifyWebhookSignature` is **defined and tested** at `src/lib/services/notification/whatsapp.ts:258-268` and `src/__tests__/services/whatsapp.test.ts:327`, but no caller invokes it. There is no `WHATSAPP_VERIFY_TOKEN` env handler, no `hub.verify_token` GET handler.
- `updateWhatsAppMessageStatus` (`whatsapp.ts:236-253`) exists to flip messages to DELIVERED/READ but is also never wired. So all `WhatsAppMessage` rows stay in `SENT` forever, even after delivery/read receipts arrive.
- This means Story 0.2 inbound webhook is unimplemented despite the doc claiming Phase 1 done.

---

## 4. Email via Resend

**Files:** `src/lib/resend.ts` (12 lines), `src/emails/invoice-email.tsx`, `src/actions/invoice.ts:348-443`.

- **Templates**: 1 only — `invoice-email.tsx`. No payment-overdue template, no shipment-arrived template, no welcome/invite template. The `EMAIL` channel in the notification matrix at `task-reminders.ts:537` will never produce an email even if Resend were wired.
- **Failure handling**: `actions/invoice.ts:427-430` — on Resend error, throws and the server action returns 500. Any pending invoice status update on line 433 is therefore not reached. No retry queue.
- **Dispatch hooks**: `sendInvoiceEmail` is invoked **only** from manual UI action, not from any cron, not from `createNotification`. The `EMAIL` channel branch in `index.ts:115` does not call Resend at all.
- **Auth**: `RESEND_API_KEY` log-warn at startup but module is exported either way (`resend.ts:6-10`) — silent fail in prod if env missing. **P1.**
- **From address default**: `Mazin <invoices@mazin.sd>` (`resend.ts:12`) — domain not necessarily verified in Resend, will hard-fail with `domain not verified` until configured.

---

## 5. Auto-trigger on stage advance

**File:** `src/actions/tracking.ts`.

- **Verified**: `advanceToNextStage` at `tracking.ts:339` does invoke `fireStageNotification` at `tracking.ts:498-503` (mid-flow) and again at `tracking.ts:506-508` for the final DELIVERED leg.
- `updateTrackingStage` also fires it on `COMPLETED` at `tracking.ts:320-325`.
- `STAGE_MILESTONE_MAP` at `tracking.ts:24-36` maps all 11 stages.
- **However:**
  - `tracking.ts:49`: `notifyShipmentMilestone(...).catch(() => {})`. Silent swallow — failure neither logged nor reported. If WhatsApp consistently fails for a tenant, no operator ever sees it. **P1.**
  - The wrapper requires a `clientId` — shipments without a linked client (e.g. internal) get no client notification, but the operator-side `STAGE_COMPLETED` to the `userId` is also not fired separately.
  - Same call exists twice in `advanceToNextStage` (lines 498 and 507). The 507 path is only when `nextStageType` is null, but it can fire on top of the 498 call when the completed stage is also `DELIVERED` — duplicate notification (no dedupKey is passed in `notifyShipmentMilestone`). **P2.**

---

## 6. Payment model

**Files:** `prisma/models/operations.prisma:150-213` (`ShipmentPayment`), `prisma/models/invoice.prisma:8-135` (`Invoice`).

- **`ShipmentPayment`**: tracks payments **out** to 8 payees (CUSTOMS, SEA_PORTS, SHIPPING_LINE, SSMO, MINISTRY_OF_TRADE, TRANSPORT, CLEARING_AGENT, OTHER). Status enum `PENDING/PARTIAL/PAID/CONFIRMED/CANCELLED`. No bank gateway integration — `referenceNo`/`receiptNo` are free-text strings. There is **no top-level `Payment` model** for client-paid amounts; statement-of-account "credits" are derived from `ShipmentPayment` rows where `payee=CLEARING_AGENT` (`actions/invoice.ts:823-834`). This is a significant data-model smell: client receivables and pass-through outflows share one table. **P1.**
- **`Invoice.status`**: `DRAFT/SENT/PAID/OVERDUE/CANCELLED` (`invoice.prisma:8-14`). Auto-flip to `OVERDUE` happens only inside `sendInvoiceReminderSchedule` cron (`task-reminders.ts:506-515`), driven by `dueDate < now`. No event-bus, no DB trigger.
- **`Container.demurrage` flow**: `Container` model at `operations.prisma:9-45` has demurrage fields. The cron at `src/app/api/cron/demurrage/route.ts:48-69` operates on **`Shipment` not `Container`** — it reads `shipment.demurrageStartDate`, `shipment.freeDays`, `shipment.demurrageDailyRate`, ignoring the per-container fields. So the per-container demurrage tracking promised by the schema is **not driven by the cron**. **P1.**

---

## 7. Stripe / Bankak / Mpesa / Tap

**Status: NONE WIRED. P0 if production goal includes online payments.**

`grep -rn "stripe\|tap\|bankak\|mpesa\|m-pesa" /Users/abdout/mazin/src` returns **zero matches**. No SDK in `package.json`. No webhook routes exist. All payment recording is manual entry of `referenceNo`/`receiptNo` strings via `actions/shipment-payment.ts:65`.

---

## 8. Public payment link `/[lang]/pay/[token]`

**Status: NOT IMPLEMENTED. P0 if intended.**

- No directory under `src/app/[lang]/pay/`. `find` shows only `finance/banking/payment-transfer` (internal admin) and `project/[id]/payments` (auth-gated).
- No `paymentToken` or `PaymentToken` field/model in any `prisma/models/*.prisma` file.
- The closest "public-facing payment artefact" is the WhatsApp invoice share at `actions/invoice.ts:975-1042`, which sends a link to `/api/invoice/{id}/pdf` — but **that PDF route is auth-gated** (see point 13), so the link in the WhatsApp message **404s for the recipient client** who is not logged in. **P0** for the share-via-WhatsApp UX.

---

## 9. Idempotency

- **No `IdempotencyKey` model.** `grep -rn "IdempotencyKey"` returns zero. No middleware around `createShipmentPayment` / `markPaymentConfirmed` / `markStagePaymentReceived`.
- Server actions `createShipmentPayment` (`shipment-payment.ts:65`), `markPaymentConfirmed` (`shipment-payment.ts:226`), `markStagePaymentReceived` (`actions/invoice.ts:590`) — none are idempotent. Double-click → double payment row. **P1.**
- What does exist:
  - `JobRun` table for cron-level idempotency (`prisma/models/operations.prisma:284-298`, `lib/jobs/lock.ts`). Solid.
  - `Notification.dedupKey` `@unique` (`notification.prisma:98`). Used by demurrage cron and reminder buckets. Solid for notification de-dup, not for payment de-dup.
- `formatInvoiceNumber(count + 1)` at `actions/invoice.ts:73,532,724` is a **non-atomic count-then-write** with no unique-on-conflict-retry. Concurrent invoice creation by the same user produces **duplicate invoice numbers**, which then trip `invoiceNumber @unique` (`invoice.prisma:74`) and the second request errors. **P0.**

---

## 10. Demurrage cron

**File:** `src/app/api/cron/demurrage/route.ts`.

- **Auth**: bearer-token check against `CRON_SECRET` (`route.ts:18-25`). If unset, blocks all (good). Vercel-cron compatible.
- **Iterates active containers?** No — iterates **shipments** with `demurrageStartDate not null` and `status != DELIVERED` (`route.ts:48-69`). The `Container` table is ignored, so multi-container shipments only get one alert based on shipment-level fields.
- **Idempotent?** Yes (two layers): `withJobLock(... bucket: 'day' ...)` short-circuits double firings (`route.ts:44-47`); each `createNotification` uses `dedupKey: notificationDedupKey({ kind: 'demurrage:<urgency>', resourceId: shipment.id })` (`route.ts:122-125`).
- **Sends 7d/3d/1d/exceeded?** Yes — thresholds at `route.ts:89-94`: `[{days:7,'approaching'},{days:3,'warning'},{days:1,'critical'},{days:0,'overdue'}]`. WhatsApp only fires when `freeDaysRemaining <= 1` (`route.ts:111-112`).
- **Issues:**
  - Threshold check is exact equality `freeDaysRemaining !== threshold.days` (`route.ts:97`). If a shipment is created mid-cycle and the cron skips a day (deploy outage, lock failure), the threshold day passes silently. Should be `<=` with already-sent dedup. **P1.**
  - Container release in `tracking.ts:452-460` flips containers to `RELEASED`, but this cron filters at the shipment level only — so a still-WARNING container after a partial release on a multi-container shipment never gets demurrage alerts at the container level.
  - For overdue case it never re-fires past day-0; only one "overdue" alert per shipment ever. The check `freeDaysRemaining !== 0` will be true for `-2`, so **only day-0-overdue fires once and never again**. The `daysOverdue` accrual amount keeps climbing in the DB but the client gets one alert. **P1.**

---

## 11. Reminders cron `/api/cron/reminders`

**File:** `src/app/api/cron/reminders/route.ts`.

- **Auth**: same `CRON_SECRET` bearer (`route.ts:31-42`). Sentry check-in monitor wired (`route.ts:53-66`). Good.
- **Lock**: `withJobLock` daily bucket (`route.ts:59-63`). Good.
- **What it sends** (via `runAllReminderJobs` in `lib/jobs/task-reminders.ts:587`):
  - `sendTaskDueSoonReminders` — IN_APP+WHATSAPP, 24h horizon (`task-reminders.ts:24,74`).
  - `sendTaskOverdueAlerts` — IN_APP+WHATSAPP (`task-reminders.ts:107,147`).
  - `sendStageAttentionAlerts` — 48h, IN_APP only (`task-reminders.ts:179`).
  - `sendStageSlaBreachAlerts` — IN_APP/+WHATSAPP on breach (`task-reminders.ts:410`).
  - `sendPaymentOverdueReminders` — duplicates the next one, IN_APP+WHATSAPP (`task-reminders.ts:249`).
  - `sendInvoiceReminderSchedule` — T-7/T-1/due/+3/+7/+14/+30 buckets, **IN_APP+WHATSAPP+EMAIL** (`task-reminders.ts:481-569`). Note: requests EMAIL channel which silently no-ops (see point 1). **P1.**
  - `sendIMFormExpiryAlerts` (`task-reminders.ts:314`).
  - `purgeStaleJobRuns` (`task-reminders.ts:579`).
- **Issue: `sendPaymentOverdueReminders` AND `sendInvoiceReminderSchedule` both run** (`runAllReminderJobs`, lines 602-606). Both notify clients about overdue invoices. The first is doc'd as the older path; only the second has dedup. **Double notifications for overdue invoices.** **P1.**
- **Issue: `sendTaskDueSoonReminders` and `sendTaskOverdueAlerts` use `findFirst` for last-24h check** (lines 50-58, 127-135) instead of `dedupKey`. Race condition between two simultaneous cron firings could send twice.

---

## 12. Invoice number generation

**File:** `src/actions/invoice.ts:72-73, 531-532, 723-724`. Helper: `src/components/platform/invoice/config.ts` (`formatInvoiceNumber`).

```ts
const count = await db.invoice.count({ where: { userId: session.user.id } })
const invoiceNumber = formatInvoiceNumber(count + 1)
```

- **Race-safe?** **No.** This is the textbook count-then-insert race. Two concurrent `createInvoice` calls both read count=N, both write `(N+1)/YY`. The second write trips `Invoice.invoiceNumber @unique` (`invoice.prisma:74,129`) and throws.
- The fix would be a sequence table or `INSERT ... RETURNING` retry loop. Neither exists.
- Three sites (`invoice.ts:72`, `:531`, `:723`) repeat the same pattern.
- **P0** for any tenant doing >1 invoice/min concurrently or two operators creating in parallel.
- A second skin-deep concern: format is `sequence/YY` but the sequence is **all-time per-user, not per-year**. After year rollover, invoice 1045/26 follows 1044/25 — never resets. **P2.**

---

## 13. PDF generation

**File:** `src/app/api/invoice/[id]/pdf/route.ts`.

- **Streaming?** No — `renderToBuffer` (`route.ts:46`) blocks the request thread, then writes the full Uint8Array. **P2.**
- **Auth (must be invoice owner or staff)?** `auth()` checked at `route.ts:20-23`; query is scoped `where: { id, userId: session.user.id }` (`route.ts:30`). So **only the invoice owner (the operator) can fetch**. **The client recipient cannot fetch their own invoice PDF** because the client never has an authed session.
  - This contradicts the WhatsApp share UX in `actions/invoice.ts:1001` which builds `pdfUrl = ${baseUrl}/api/invoice/${invoiceId}/pdf?locale=${locale}` and ships it to the client over WhatsApp. **The client URL 401s when opened.** **P0.**
  - A token-based public endpoint (e.g. `?t=<signed-token>` or `/pay/[token]`) is required.
- **No staff-role bypass** — even an admin/staff user from the same org cannot fetch another user's invoice (single-tenant `userId` scope only). Multi-tenant scenario or shared-staff scenario broken. **P1.**

Same notes apply to `src/app/api/statement/[id]/pdf/route.ts:22-30` — client never sees their own statement.

---

## Severity Summary & Fixes

### P0 (production blockers)

1. **Invoice number race** — `actions/invoice.ts:72-73, 531-532, 723-724`. Concurrent invoice creates collide on `Invoice.invoiceNumber @unique`. *Fix:* dedicated `InvoiceSequence` table per (userId, year) with a single atomic transaction, or wrap creation in a retry loop on P2002.
2. **Public PDF link is auth-gated** — `src/app/api/invoice/[id]/pdf/route.ts:30`. WhatsApp share message at `actions/invoice.ts:1001` ships the URL to clients but it 401s. *Fix:* add signed-token public route `/api/invoice/[id]/pdf/public?t=...` or `/[lang]/pay/[token]/invoice` page; expire after 14 days.
3. **No public payment link `/[lang]/pay/[token]`** — does not exist. No `PaymentToken` model. *Fix:* model + signed token route + read-only invoice/payment-instructions page.
4. **No payment gateway integration** — Stripe/Tap/Bankak/Mpesa entirely absent. *Fix:* if production accepts online payment, wire at minimum one provider with webhook → idempotent payment record.
5. **Inbound WhatsApp webhook missing** — `src/app/api/whatsapp/webhook/route.ts` does not exist. `updateWhatsAppMessageStatus` and `verifyWebhookSignature` are dead code. *Fix:* create route with GET (verify_token) + POST (signature verify → update WhatsAppMessage status / inbound message → reply).

### P1 (must-fix before scale)

6. **EMAIL channel is a stub** — `notification/index.ts:115-118`. Reminder cron requests EMAIL and silently drops. *Fix:* wire Resend send in the EMAIL branch using a lookup table from `NotificationType → email template`.
7. **No idempotency on payment recording** — `actions/shipment-payment.ts:65,226`, `actions/invoice.ts:590`. *Fix:* accept a client-supplied `idempotencyKey` (UUID), unique constraint on `(userId, key)` table.
8. **WhatsApp template name source-of-truth conflict** — `whatsapp.ts:16-44` (operational names like `task_assigned`) vs `templates.ts:147-153` (`task_assigned_ar`). *Fix:* delete one map.
9. **Phone validation in WhatsApp not using Sudan validator** — `whatsapp.ts:63` does naive cleanup; bypasses `lib/validation/phone.ts:31`. *Fix:* call `normalizeSudanPhone(phone)` and refuse send if null.
10. **Two notification dispatchers can dual-insert** — `dispatch-notification.ts:93` then `:227` calls `createNotification` which inserts again. *Fix:* make `dispatchNotification` the single entry point.
11. **Notification status hides per-channel failures** — `index.ts:135-144` flips overall to SENT if any channel succeeds. *Fix:* model per-channel attempts (`NotificationDelivery` table) or at minimum store last-error per channel.
12. **Demurrage cron fires "overdue" only once at day 0** — exact equality `!== 0` at `cron/demurrage/route.ts:97`. After day 0, alerts stop. *Fix:* sticky overdue branch — `if isOverdue && now > lastSentDate + 7d` re-alert.
13. **Demurrage cron ignores Container table** — operates at shipment level only (`route.ts:48-69`). *Fix:* iterate `Container` rows with `freeTimeExpiry`.
14. **Two overlapping invoice-overdue jobs** — `task-reminders.ts:602` + `:606` (`sendPaymentOverdueReminders` + `sendInvoiceReminderSchedule`). Double notifications. *Fix:* delete `sendPaymentOverdueReminders`.
15. **`fireStageNotification` swallows errors** — `tracking.ts:49`: `.catch(() => {})`. *Fix:* at least `log.error` and `Sentry.captureException`.
16. **Resend module starts even without API key** — `lib/resend.ts:6-10`. *Fix:* throw at boot if `RESEND_API_KEY` and `EMAIL` is requested anywhere.
17. **PDF route has no staff bypass** — `route.ts:30` strict `userId` scope. *Fix:* add role check for organization members.
18. **`ShipmentPayment` conflates client receivables with vendor payouts** — `prisma/models/operations.prisma:150-213`. *Fix:* introduce a separate `ClientPayment` model or split via direction (`IN`/`OUT`).

### P2 (polish / future-proofing)

19. **WhatsApp hard-codes Arabic** — `whatsapp.ts:110`. *Fix:* thread locale through `sendWhatsAppMessage`.
20. **Duplicate `fireStageNotification` for DELIVERED** — `tracking.ts:498` & `:507` can both fire.
21. **PDF not streamed** — `renderToBuffer` blocks. *Fix:* stream via `ReadableStream` for large PDFs.
22. **Invoice number sequence does not reset by year** — sequence is lifetime per-user.

---

## Bottom line on the doc claim

The `AUTOMATION_GAP_ANALYSIS.md:14` line "Status calls → Auto-notifications | **COMPLETE**" is partially true: stage-advance does fire `notifyShipmentMilestone`. But "complete" hides:
- email channel is a stub,
- inbound WhatsApp webhook is missing,
- public client link infrastructure (PDF, payment) is missing,
- payment recording is not idempotent,
- invoice numbering is racy.

I would not ship Phase 1 to a real-money tenant until at least the P0 list is addressed.
