# Mazin: Storage / OCR / PDF / AI Production-Readiness Audit

## TL;DR

**Story 0.1 status: "code written, partially wired, dangerously divergent."**

The `src/lib/storage/*` module is real, complete, and well-typed. It is wired into exactly **one** production code path (`uploadShipmentDocument`), but that action has no UI calling it. The only UI that does call upload (`receipt/upload-form.tsx`) bypasses the storage module entirely and calls `uploadReceipt`, which is a hardcoded stub. OCR is real but unreachable. Only PDF generation (invoice + statement) is fully wired and works end-to-end — though both use a non-Arabic font.

---

## 1) Storage layer (Story 0.1) — wiring trace

**Storage module: real and complete.**
- `src/lib/storage/s3-client.ts:16-42` — lazy S3 client; throws if `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (line 22-25) or `AWS_S3_BUCKET` (line 38-40) is unset.
- `src/lib/storage/upload.ts:59-136` — `uploadFile`: auth check, MIME/size validation via `STORAGE_CONFIG`, SHA-256 dedupe, S3 PutObject, `FileRecord` row creation.
- `src/lib/storage/upload.ts:143-169` — `deleteFile` with ownership check + admin override + best-effort CloudFront invalidation.
- `src/lib/storage/cloudfront.ts:66-85` — `getSignedAssetUrl` exists (1-hour default expiry, falls back to **unsigned** URL with only a warn log if signing keys missing).
- `src/lib/storage/config.ts:32-93` — MIME allowlist + size caps per `UploadKind`.
- `prisma/models/operations.prisma:311` — `FileRecord` model exists.

**Wiring: only one consumer.**
The codebase has exactly **one** production import of `uploadFile`:
- `src/actions/shipment-document.ts:8` → used at line 168 inside `uploadShipmentDocument(formData)`.

**That action is never called from any UI.** I grepped the whole tree:
- No `tsx` file imports `uploadShipmentDocument`.
- No file-input element exists in the project document checklist UI (`src/app/[lang]/(platform)/project/[id]/docs/page.tsx:1-330` is read-only — it shows checklist statuses but provides no upload button).

**Other upload paths the module supports but nothing wires up:** `pod-photo`, `inspection-photo`, `chat-attachment`, `avatar`, `company-logo`, `invoice-pdf`. None have upload UIs in the app.

**Receipt upload bypasses the storage module entirely:**
- `src/components/platform/finance/receipt/upload-form.tsx:21,77` — calls `uploadReceipt(formData)`.
- `src/components/platform/finance/receipt/actions.ts:66-74` — `uploadReceipt` is a **stub**; comment explicitly says "Receipt upload requires file storage configuration (S3/R2) — not yet available." The action returns `{ success: false, error: "..." }` for every call. It does **not** import `uploadFile`.

So even the only production file-input the user can see is broken end-to-end.

---

## 2) Production blockers — env-unset behaviour

- `src/lib/storage/s3-client.ts:22-25,38-40` — explicit `throw new Error(...)` when AWS creds or `AWS_S3_BUCKET` are unset. There is **no silent fallback to local disk or no-op.** Code is gated by env at call time, not at boot.
- `src/lib/env.ts:83-94` — env validation marks all AWS / CloudFront vars as `optional()`. `isProduction` does **not** require them, so the app boots without storage in prod.
- `src/lib/storage/cloudfront-url.ts:24-32` — `getCloudFrontUrl` falls back to raw S3 URL, then to the bare key; never throws.
- `src/lib/storage/cloudfront.ts:54-78` — `getSignedAssetUrl` falls back to the **unsigned** URL with only a `log.warn`. This is the dangerous path: in prod with S3 wired but signing keys missing, every "private" file becomes effectively public.

**Risk surface today:** since no UI calls `uploadFile`, you cannot trip the throw at runtime — but turning on uploads without setting the AWS env will instantly 500 the relevant action.

---

## 3) OCR receipt extraction

**Real, not stubbed — but not callable.**

- `src/lib/services/ocr/index.ts:1-5` — uses `@ai-sdk/anthropic` with `claude-sonnet-4-20250514`.
- `src/lib/services/ocr/index.ts:275-310` — `extractReceipt(fileUrl)` builds a Zod-validated `generateObject` call with vision content.
- Wrapper `src/components/platform/finance/receipt/ai/extract-receipt-data.ts:22-46` — auth-checked, env-gated on `ANTHROPIC_API_KEY`.

Problems:
- No production caller. Searching for `extractReceiptData(`, `extractDocumentData(`, `extractAndPopulate*` returns **zero non-test consumers**.
- `actions.ts:141-168` `retryReceiptExtraction` is the only function that touches receipt OCR semantically, and the comment at line 151-152 says `OCR extraction isn't wired yet`. It just resets status to `PENDING`.
- No timeout, retry budget, max-tokens, max-pages, or content-length cap on any `extract*` call.

---

## 4) HS code OCR / suggestion

**Real OCR pipeline, real DB lookup, but no AI suggestion is wired into the UI.**

- `src/lib/services/ocr/index.ts:44` — schema field `suggestedHSCodes` is asked of the model in `extractCommercialInvoice`.
- `src/actions/document-extraction.ts:53` — calls `extractCommercialInvoice(fileUrl)` inside `extractAndPopulateInvoice` — **but this server action has zero callers** in the entire `src/` tree (grep confirmed).
- `src/actions/duty-calculator.ts:63-150` — real DB-backed HS lookup/search; not AI.
- `src/components/platform/customs/hs-code-actions.ts:18,46,54-69` — DB-only; no AI.
- The HS code UI (`src/app/[lang]/(platform)/project/[id]/duty/duty-calculator.tsx:113`) uses `searchHsCodes` and `calculateDuty`, both DB-only.

**Verdict:** AI HS-code suggestion code exists; nobody calls it.

---

## 5) Invoice PDF generation

**Fully wired, with one Arabic-rendering bug.**

- `src/app/api/invoice/[id]/pdf/route.ts:1-65` — auth-checked, ownership-scoped (line 30 `userId: session.user.id`), uses `@react-pdf/renderer` `renderToBuffer`, branches between `InvoicePdf` and `ClearanceInvoicePdf` based on `shouldUseClearanceFormat(invoiceType)` or `?format=clearance` query.
- `src/components/platform/invoice/invoice-pdf.tsx:16-28`, `clearance-invoice-pdf.tsx:19-31` — both register a **Latin-only Rubik font** (Google Fonts URL `iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-...`, the `latin` subset). Rubik does have Arabic but the registered TTF file is the Latin subset only. Statements use the same registration (`statement-pdf.tsx:17-29`).
- `src/components/platform/invoice/clearance-invoice-pdf.tsx:14`, `statement-pdf.tsx:14` — import `numberToArabicWords`, `formatArabicNumerals` from `@/lib/utils/arabic-numbers`, so Arabic numerals are explicitly rendered.
- **No Cairo, Amiri, Tajawal, or Noto Naskh font registered.** Search across all three PDF builders confirms only Rubik (latin glyph set). Arabic glyphs in the rendered PDF will fall back to PDF default (typically square boxes) or break RTL shaping.

Other concerns:
- No `export const maxDuration` on either PDF route. On Vercel Hobby/Pro this defaults to 10s and PDFs >5 pages risk timeout.
- No size cap on items returned to PDF; `include: { items: { orderBy: { sortOrder: "asc" } } }` (`route.ts:31`) loads everything. A 5,000-line invoice would OOM the lambda.
- `Font.register` calls on import (top-level) — these run once per cold start, fine; but external Google Fonts URL is a runtime dep. There is no fallback font.

---

## 6) Statement of Account PDF

**Fully wired.**

- `src/app/api/statement/[id]/pdf/route.ts:1-57` — same shape as invoice route: auth-checked, ownership-scoped (line 25), uses `StatementPdf`.
- `src/components/platform/invoice/statement-pdf.tsx:1-686` — full Arabic/English statement layout (`statementOfAccount` AR label `كشف حساب` at line 386).
- Same Rubik-only font issue as invoices.
- Same missing `maxDuration` and no entry-count cap.

---

## 7) Virus scanning / MIME validation

- **No virus scanning.** Greps for `clamav`, `virustotal`, `antivirus`, `scanFile`, `scanBuffer`, `signature.scan` return zero hits.
- MIME validation exists but is **trust-the-client**: `src/lib/storage/config.ts:115-119` and `src/lib/storage/upload.ts:67` validate `file.type`, which is the browser-supplied MIME string. There is no magic-byte sniffing (no `file-type` package, no manual byte check). An attacker can rename a `.exe` to `.pdf` and set `Content-Type: application/pdf` and pass validation.
- Size limits per kind (`config.ts:32-93`) range 2–25 MB and **are enforced** server-side at `upload.ts:67`.
- HEIC is on the allowlist for `pod-photo` and `inspection-photo` but Next.js / sharp may not transform it — not a security issue, just rendering risk.

---

## 8) Signed-URL strategy for private files

**Code exists; nothing uses it.**

- `src/lib/storage/cloudfront.ts:66-85` — `getSignedAssetUrl` is exported.
- Grep across `src/` (excluding tests and the storage module itself) returns **zero** consumers.
- `upload.ts:110-111` chooses URL by `options.access`: `private` → raw S3 URL, `public` → CloudFront URL. **Neither path returns a signed URL.** A `private` upload's URL goes into `FileRecord.url` as `https://{bucket}.s3.{region}.amazonaws.com/{key}` and will be 403 unless the bucket is public-read (which would defeat "private").
- The fallback when signing keys are missing is to return the **unsigned** CloudFront URL (`cloudfront.ts:75-78`). If the CloudFront distribution origin policy allows direct origin requests with no OAC/OAI, the unsigned URL also works for anyone who knows it.

So: there is no functional "private" file flow today.

---

## 9) Unauthenticated access to user uploads

- All current `fileUrl` consumers render the URL directly:
  - `src/components/platform/finance/receipt/receipt-detail.tsx:186` `<img src={receipt.fileUrl}>`
  - `receipt-detail.tsx:198` `<a href={receipt.fileUrl}>`
- There is **no** `/api/files/[id]` viewer endpoint that re-auths and proxies. URLs are bare CloudFront (or S3) links.
- S3 keys (`upload.ts:90`) are `${userId}/${folder}/${nanoid(18)}${ext}` — userId leaks tenant identity in the URL, but the 18-char nanoid (≈93 bits) is not guessable.
- Practical exposure: any leaked URL (Slack paste, email forward, browser history sync) is permanently fetchable by anyone with the link unless CloudFront OAC + signed URLs are turned on. Today they are not.
- `next.config.ts:11-15,49,51` allowlists `*.s3.amazonaws.com` and `*.cloudfront.net` in CSP/image hosts — sensible but unrelated to access control.

---

## 10) AI cost ceiling on `extractReceipt`

- **None.** No rate limit, no daily budget, no token cap, no per-user counter on any `extract*` function in `src/lib/services/ocr/index.ts` or its wrappers.
- No timeout on `generateObject` calls (default Anthropic SDK timeout applies, ~60s).
- No retry/backoff. A 5xx from Anthropic returns an error string to the caller, so cost on failure is bounded — but a malicious user could repeatedly request OCR on a 25 MB PDF (`config.ts:35`) with no throttle. A vision request on a 25 MB document is multi-dollar per call.

Practically mitigated only because nothing calls `extractReceipt` today.

---

## 11) Chatbot

**Real Groq integration with rate limiting — good baseline.**

- `src/components/chatbot/actions.ts:3` — `@ai-sdk/groq`, model `llama-3.1-8b-instant` (line 242).
- Rate limits at `actions.ts:19-25`:
  - 10 msg/min per authed user; 5 msg/min per anon IP
  - 100 msg/day authed; 30/day anon
  - Window enforcement uses an **in-memory** `Map` (`actions.ts:27-28`) — so rate limits reset on every cold start and are per-instance, not per-fleet. On Vercel this means rate limits are functionally absent at scale.
- Message history truncated to last 20 (`actions.ts:19,238`).
- Anon rate-limit key uses `x-forwarded-for` with no `trust proxy` validation (`actions.ts:33-37`) — trivial to spoof, anon limit is effectively bypassable.
- No model token-cost cap (`generateText` at line 241-245 has no `maxTokens` / `maxOutputTokens` parameter). Anon caller can request a 4K-token answer per call.
- No prompt-injection filtering.
- Returns `error: 'Chat service is not configured'` cleanly when `GROQ_API_KEY` missing (line 213-218) — good.

---

## Findings, prioritized

### P0 — block production

1. **Receipt upload is a hardcoded stub.** `src/components/platform/finance/receipt/actions.ts:66-74` returns `success: false` for every call. The only file-input UI in the app is non-functional.
   *Fix:* replace the stub body with a call to `uploadFile(file, { kind: "receipt", originalName, metadata: { receiptId } })`, then create a `Receipt` row with `fileUrl = upload.url`. Trigger `extractReceipt(upload.url)` in the same action (or queue it).

2. **Project document upload UI does not exist.** `src/app/[lang]/(platform)/project/[id]/docs/page.tsx:1-330` is read-only. The `uploadShipmentDocument` server action at `actions/shipment-document.ts:149` is dead code.
   *Fix:* add a per-row upload button that posts a FormData to `uploadShipmentDocument(formData)`. Without this, the entire BL/CI/PL document workflow is non-existent.

3. **No virus scanning, no magic-byte MIME check.** `lib/storage/upload.ts:67` trusts client-supplied `file.type`.
   *Fix:* add `file-type` (or `magic-bytes`) to sniff the first 4096 bytes server-side and reject when sniffed type isn't in the allowlist. For a clearance-document app where users routinely upload third-party PDFs, a ClamAV worker (or Lambda + ClamAV layer) is reasonable; minimum bar is magic-byte verification before `PutObject`.

4. **"Private" files are not actually private.** `lib/storage/upload.ts:110-111` returns a raw S3 URL for `access: "private"`. `lib/storage/cloudfront.ts:75-78` falls back to unsigned URL when signing keys are absent. There is no `/api/files/[id]` proxy.
   *Fix:* add a `GET /api/files/[id]/route.ts` that does session+ownership check, then returns a 302 to `getSignedAssetUrl(record.s3Key, { expirySeconds: 300 })`. Store only the S3 key in `FileRecord.s3Key` (already done) and route every consumer through `/api/files/${id}` instead of the bare `fileUrl`.

5. **Arabic font in PDFs is broken.** All three PDF builders (`invoice-pdf.tsx:16-28`, `clearance-invoice-pdf.tsx:19-31`, `statement-pdf.tsx:17-29`) register only the Latin-glyph TTF of Rubik. Arabic content (`Cairo`/Tajawal/Amiri-quality glyphs) will not render.
   *Fix:* register Cairo or Noto Naskh Arabic via TTF download. Bundle the TTF in `/public/fonts` and reference via filesystem path so cold starts don't fetch from Google.

### P1 — fix before high traffic

6. **No `maxDuration` on PDF routes.** `app/api/invoice/[id]/pdf/route.ts:1-65` and `app/api/statement/[id]/pdf/route.ts:1-57`. On Vercel default 10s, large PDFs will time out.
   *Fix:* `export const maxDuration = 30; export const runtime = "nodejs";` at top of both route files.

7. **No row-count cap on PDF data fetch.** `route.ts:31` (`include: { items: ... }`) and `statement/route.ts:26-29` (`entries: ...`). A 10K-row statement OOMs the lambda.
   *Fix:* `take: 1000` on items/entries and render a "report truncated" footer when exceeded; or paginate to multi-doc.

8. **Chatbot rate limit is process-local.** `chatbot/actions.ts:27-28` uses an in-memory `Map`. On Vercel, every invocation may be a fresh instance — limits don't aggregate.
   *Fix:* swap to Upstash Redis (`@upstash/ratelimit`) or store counters in `db.requestLog` keyed by hashed identifier.

9. **Chatbot anon IP rate limit is spoofable.** `chatbot/actions.ts:33-37` reads `x-forwarded-for` without trust validation.

10. **No `maxOutputTokens` on chatbot.** `chatbot/actions.ts:241-245`. Add `maxOutputTokens: 1024` (or similar) to bound per-call cost.

11. **Storage tests use mocked AWS only.** No integration test against LocalStack confirms real S3 + CloudFront flow.

12. **OCR pipeline is unreachable.** `actions/document-extraction.ts:1-159` (`extractAndPopulateInvoice`, `extractAndPopulateBL`) and `components/platform/finance/receipt/ai/extract-receipt-data.ts` have zero UI consumers.
    *Fix:* wire each to a button on the relevant document detail page. Also add cost guardrails before exposing.

### P2 — should fix, not blocking

13. **No AI cost ceiling on Anthropic OCR.** `lib/services/ocr/index.ts:51-310`. When you wire OCR, add: per-user daily extraction count (DB counter), `maxOutputTokens` on `generateObject`, and a hard cutoff of input file size.

14. **Unsigned CloudFront fallback is silent.** `lib/storage/cloudfront.ts:75-78` only `log.warn`s and proceeds. In production this should be either an explicit `throw` or wrapped behind `process.env.NODE_ENV === "production"` with a deny-by-default.

15. **`AWS_S3_BUCKET` and friends are `optional()` in env validation.** `lib/env.ts:83-94`. In production this allows the app to boot in a half-configured state where uploads fail at runtime instead of at boot.
    *Fix:* in `serverSchema`, when `isProduction === true`, require the AWS group together (use `.refine(...)` to require all-or-none).

16. **S3 key embeds `userId`.** `lib/storage/upload.ts:90`. Low-impact but it leaks tenant identity in URLs once shared.

17. **`uploadFile` `metadata` cast.** `lib/storage/upload.ts:124` `as never`. Tightening the Prisma JSON type would catch shape regressions.

18. **`deleteFile` does not invalidate Cloudfront before row delete.** `upload.ts:166-167` deletes the row before invalidation; if the invalidation fails, the cache may still serve content.

19. **HS code AI suggestion field (`lib/services/ocr/index.ts:44`) is asked of the model but never persisted or surfaced** — wasted token cost when the OCR is wired.

---

## "Story 0.1" verdict

**Code written but not wired.** The storage primitives are production-quality. The Prisma `FileRecord` model exists. The S3 + CloudFront helpers are correct and env-gated. But the only UI that should consume them (`upload-form.tsx`) calls a different action that is hardcoded to fail, and the project's main document workflow has no upload UI at all. Treat Story 0.1 as 70% complete — the back-end is real, the front-end and the wiring are not.
