# Mazin Production Readiness Audit — i18n / RTL / Brand

**Repo:** `/Users/abdout/mazin` · **Brand:** Abdout (founder Mazin Abdout) · **Default locale:** `ar`

## Executive verdict

**Not shippable as-is.** Significant cleanup completed since QA report 2026-04-25 (dictionaries are clean, hero/marketing copy correct in source, RTL hygiene strong, key-parity perfect at 2348/2348), but **6 of 16 QA bugs remain unfixed in source**, plus 4 new defects found.

---

## P0 — Production Blockers

### P0-1. Hogwarts brand leak in source comments + UI doc files (Bug #1, #9 — UNFIXED)

Brand string "Hogwarts" still appears in **17 source locations**. None are user-visible runtime strings (dictionaries are clean — `grep Hogwarts` in `ar.json`/`en.json` returns nothing), but they are shipped in the build artifact (JSDoc + .md inside `src/`).

- `src/app/[lang]/(platform)/finance/receipt/[id]/page.tsx:3` — JSDoc "Follows Hogwarts page pattern"
- `src/components/platform/dashboard/finance-overview.tsx:35` — `* FinanceOverview Component - Hogwarts Edition`
- `src/components/platform/dashboard/admin-client.tsx:28` — `* AdminDashboardClient - Hogwarts Edition`
- `src/components/platform/finance/receipt/receipt-detail.tsx:4`
- `src/components/platform/finance/receipt/content.tsx:3`
- `src/components/platform/finance/receipt/types.ts:3`
- `src/components/platform/finance/receipt/validation.ts:3`
- `src/components/platform/finance/receipt/receipt-card.tsx:4`
- `src/components/platform/finance/receipt/columns.tsx:3`
- `src/components/platform/finance/receipt/table.tsx:3`
- `src/components/icons/types.ts:4` — "Hogwarts icon management system"
- `src/components/table/README.md:3,369` — markdown ships in repo
- `src/components/platform/finance/banking/INTEGRATION_COMPLETE.md:5` — explicit "Hogwarts school automation platform"
- `src/lib/storage/cloudfront.ts:11`, `cloudfront-url.ts:8`, `s3-client.ts:4`, `upload.ts:11`, `config.ts:4` — all `* Lifted from \`~/hogwarts/...\``
- `src/lib/jobs/task-reminders.ts:473` — `(lifted from hogwarts \`fee-overdue\`)`

**Fix:** one-shot rename pass.
```bash
grep -rln "Hogwarts\|hogwarts" src --include="*.ts" --include="*.tsx" --include="*.md" \
  | xargs sed -i '' -E 's/Hogwarts Edition//g; s/Follows Hogwarts (component|page|table|content|validation|pattern) ?(pattern|conventions)?/Standard pattern/g; s/~\/hogwarts\//.\//g; s/Hogwarts/Mazin/g; s/hogwarts/mazin/g'
```
Then delete `src/components/platform/finance/banking/INTEGRATION_COMPLETE.md` or rewrite.

---

### P0-2. `manifest.webmanifest` not in source (Bug #2 — UNFIXED)

No `src/app/manifest.ts`, no `public/manifest.webmanifest`, no `public/manifest.json`. Confirmed via `find . -maxdepth 4 -name "manifest*" -not -path "*/node_modules/*"` — returns only `./src/components/table/manifest.ts` (unrelated UI registry). Per QA report this means the app's PWA manifest is currently served by stale `.next` cache as Hogwarts content.

**Fix:** create `src/app/manifest.ts`:
```ts
import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Port Sudan Logistics`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    categories: ["business", "logistics", "productivity"],
    lang: "ar",
    dir: "rtl",
  }
}
```
Also add `/icon-192.png`, `/icon-512.png` under `public/`.

---

### P0-3. `/track` index NOT in `publicRoutes` (Bug #4 — UNFIXED)

`src/routes.ts:35-40` only lists prefixes:
```
"/en/track/",  "/ar/track/",
```
`src/middleware.ts:86-87` matches via `pathname.startsWith(prefix)` — the trailing slash means bare `/ar/track` (the index page that DOES exist at `src/app/[lang]/track/page.tsx`) does NOT match. It also is NOT listed in `publicRoutes` array. Result: unauthenticated visitors hitting `/ar/track` redirect to login.

**Fix:** add to `src/routes.ts:10-29`:
```ts
"/track",
"/en/track",
"/ar/track",
```

---

### P0-4. `siteConfig` URL is `abdoutgroup.com` — verify domain ownership

`src/lib/site.ts:4` hardcodes `https://abdoutgroup.com` and `src/lib/site.ts:5` `https://abdoutgroup.com/og.png`. `src/app/layout.tsx:5` uses this as `metadataBase`, propagating to OG/Twitter cards and sitemap. If production deploys to a different domain (e.g. `mazin.sd`, vercel preview URL), all canonical links and OG images will be wrong. Twitter handle `@abdoutgroup` (`src/app/layout.tsx:36`) also needs verification.

**Fix:** confirm `abdoutgroup.com` is the production domain and the `/og.png` is uploaded; otherwise update `src/lib/site.ts` and re-verify metadata.

---

## P1 — High-severity defects

### P1-1. Hardcoded English in customs table (Bug confirmation)

`src/components/platform/customs/content.tsx:48-53` has 6 hardcoded `<TableHead>` labels that bypass the dictionary entirely:
```
<TableHead>ACN Number</TableHead>
<TableHead>Shipment</TableHead>
<TableHead>Consignee</TableHead>
<TableHead>Vessel</TableHead>
<TableHead>Status</TableHead>
<TableHead>ETA</TableHead>
```
Compare to sibling `shipments/content.tsx:48-52` which correctly uses `dict.shipments?.shipmentNumber ?? "Number"` etc.

Other hardcoded English:
- `src/components/platform/settings/team/pending-invites.tsx:20` — `Pending invites ({invites.length})`
- `src/components/platform/settings/team/pending-invites.tsx:24-27` — Email / Role / Expires / Actions
- `src/components/platform/settings/security/audit-log-list.tsx:50-54` — When / Actor / Action / Resource / IP
- `src/components/platform/finance/permissions/content.tsx:467-469` — User / Role / Permissions

**Fix:** mirror the `dict.shipments?.field ?? fallback` pattern. Add the 6 customs strings + 16 above into both `ar.json`/`en.json` under their feature namespaces.

---

### P1-2. Zod messages uniformly hardcoded English (Check #14 — UNRESOLVED)

Every validation file has English-only messages. Sample:
- `src/components/platform/shipments/validation.ts:7,21,22` — `"Description is required"`, `"Shipper is required"`, `"Consignee is required"`
- `src/components/platform/marketplace/validation.ts:5,9,10,11,33,35,39,40,56,61,71,72` — 12 messages, all English
- `src/components/platform/settings/organization/validation.ts:14` — `"Company name is required"`
- `src/components/platform/settings/profile/validation.ts:10` — `"Name is required"`
- `src/components/platform/finance/fees/validation.ts:58,67,81` — `"Fixed-fee templates require an amount."` etc.

When AR user submits an invalid form, the inline error appears in English — major UX defect for the default locale.

**Fix options (pick one and apply project-wide):**
1. **Lazy-key pattern:** `z.string().min(1, "validation.requiredField")` then translate via dictionary at render site (`<p>{dict[err.message]}</p>`).
2. **Schema factory:** `export const makeShipmentSchema = (dict: Dictionary) => z.object({...})` and call from server actions / form components with current locale.
3. **Zod `.errorMap` injection:** wrap with locale-specific error map.

Recommend option 2.

---

### P1-3. `NEXT_LOCALE` cookie misalignment (Bug #16 — UNFIXED)

`src/middleware.ts:117-128` only sets the cookie when redirecting from an unlocalized path (e.g. `/login` → `/ar/login`). When a user visits `/ar/X` directly with `NEXT_LOCALE=en` cookie (set from a prior `/en` visit), the middleware passes through without rewriting the cookie. Subsequent unlocalized request reads the stale cookie at line 20–22 and routes back to English, contradicting the URL.

**Fix:** in `src/middleware.ts`, after the `pathnameHasLocale` check (around line 130), align cookie when locale in URL differs from cookie:
```ts
const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
if (locale && cookieLocale !== locale) {
  const response = NextResponse.next()
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
```

---

### P1-4. Inconsistent Arabic locale tag — `ar-SA` vs `ar-SD` (NEW finding)

The site is for Sudan but date/number formatting locale is split:
- `ar-SD` (correct): `src/app/[lang]/(platform)/shipments/[id]/page.tsx:66-67`, `project/[id]/payments/page.tsx:83,93,192,240`, `project/[id]/duty/duty-calculator.tsx:60`, `finance/content.tsx:56`, `finance/fees/content.tsx:38`, `customs/content.tsx:70`, `shipments/content.tsx:69`
- `ar-SA` (Saudi Arabia, **wrong**): `src/app/[lang]/(platform)/project/[id]/invoices/page.tsx:62,72`, `project/[id]/report/page.tsx:32,145,193,214`, `chatbot/prompts.ts:175`, `chatbot/chat-window.tsx:99,158`, `platform/project/card.tsx:39`

`ar-SA` returns Hijri-aware date formatting and Hindi-Arabic numerals, while `ar-SD` returns Latin numerals + Gregorian — UI will look inconsistent across pages. `localeConfig.ar.currency = "SDG"` (`src/components/internationalization/config.ts:14`) and `dateFormat: 'dd/MM/yyyy'` confirm Sudan as the canonical locale.

**Fix:** normalize all to `ar-SD`. One-liner:
```bash
grep -rln "'ar-SA'" src --include="*.ts" --include="*.tsx" \
  | xargs sed -i '' "s/'ar-SA'/'ar-SD'/g"
```
Then introduce a single helper `src/lib/i18n/format.ts` exporting `formatDate(locale, date)` and `formatNumber(locale, n)` so this never drifts again.

---

### P1-5. External Hogwarts CDN `d1dlwtcfl0db67.cloudfront.net` (Bug #8 — RESOLVED in source, but verify build)

`grep -rn "d1dlwtcfl0db67"` in `src/`, `public/`, dictionaries, components: **0 hits**. The Hogwarts CDN is no longer referenced anywhere in source. Generic `*.cloudfront.net` references are user-configurable user-asset domain (`CLOUDFRONT_DOMAIN` env, `next.config.ts:15,49,51`) — fine.

QA report saw it via runtime stale `.next` cache. Action: rebuild and re-verify; if it disappears, this is closed.

---

## P2 — Quality / hygiene

### P2-1. Hardcoded `text-left` in 1 marketing component

Tailwind logical-property hygiene is excellent overall. Only finding:
- `src/components/template/timeline/timeline.tsx:42` — `md:pl-20`
- `src/components/template/timeline/timeline.tsx:47` — `pl-20 pr-4 md:pl-4`
- `src/components/template/timeline/timeline.tsx:48` — `text-left`

In RTL these will render visually wrong. Replace with `ps-20`/`pe-4`/`text-start`.

### P2-2. Fallback English noise across finance tables

Code uses `<TableHead>{cols.x ?? "Code"}</TableHead>` defensively. If dictionary keys exist (verify per file via the `cols` namespace), fallback never fires — but if dictionary changes, English silently appears. Consider failing loudly in dev:
```ts
const fallback = (key: string) => process.env.NODE_ENV === "development" ? `MISSING:${key}` : ""
```

### P2-3. Arabic font: `Rubik`, not the QA-suggested Cairo/Tajawal

`src/components/atom/fonts.ts:19-24` configures `next/font/google` Rubik with `subsets: ["latin", "arabic"]`, weights 300–900. `src/app/[lang]/layout.tsx:24` swaps it in for `lang === "ar"`. Setup is technically correct. Rubik is a legible Arabic typeface, but the team should confirm the brand wants Rubik over Cairo/Tajawal/IBM Plex Sans Arabic — a brand-design decision, not a defect.

### P2-4. PDF Rubik font registered with `Rubik` family

`src/components/platform/invoice/{clearance-invoice-pdf,invoice-pdf,statement-pdf}.tsx` register `family: "Rubik"` for `@react-pdf/renderer` — same family as web. Good consistency. Verify font file URLs are reachable at build time. **NOTE: see `storage-ocr-pdf.md` — the registered Rubik TTF is the Latin-only subset, breaking Arabic glyphs in PDFs.**

### P2-5. Unsplash photos for board members

`src/app/[lang]/about/page.tsx:146-153` hardcodes Unsplash stock photos for the 8 board members. This is fine for staging but not for a production "Meet our team" page. Replace with real photos before launch.

### P2-6. RTL hygiene confirmed working

- `getDir`/`isRTL` exist at `src/components/internationalization/config.ts:27-33` ✓
- `<html lang dir>` propagated correctly at `src/app/[lang]/layout.tsx:27` and `src/app/not-found.tsx:34` ✓
- `dir={dir}` on key public pages: track page (`src/app/[lang]/track/page.tsx:67,81`), containers, project pages
- `dir="rtl"` forced on Arabic-only inputs: `settings/organization/form.tsx:131`, `finance/fees/template-dialog.tsx:220` ✓
- Logical Tailwind classes used widely: `me-2`, `text-end`, `ms-6`

### P2-7. Dictionary parity perfect

```
2348 ar keys
2348 en keys
diff: 0 lines
```
No missing keys either direction. ✓ This is the strongest signal in the audit.

---

## Summary table

| Check | Status | Severity |
|---|---|---|
| 1. Hogwarts in src/ | 17 hits in JSDoc/comments + 1 .md; 0 in dictionaries | **P0-1** |
| 2. `d1dlwtcfl0db67` CDN | 0 hits in source (only stale .next per QA) | resolved (verify build) |
| 3. Manifest | **MISSING** | **P0-2** |
| 4. siteConfig | name=`Abdout`, desc=`Export/Import Management System for Port Sudan`, url=`abdoutgroup.com` | P0-4 (verify domain) |
| 5. Marketing routes in publicRoutes | `/about`, `/services`, `/service`, `/contact` listed for both locales ✓ | OK |
| 6. `/track` index | **NOT** in publicRoutes (only `/track/` prefix) | **P0-3** |
| 7. ar/en parity | 2348 = 2348, diff=0 | OK |
| 8. Hardcoded English | 6+ hits in customs/team/audit/permissions tables | **P1-1** |
| 9. RTL utilities | `getDir`/`isRTL` present, `dir={dir}` widely used | OK |
| 10. Locale cookie | middleware doesn't realign cookie on direct URL visit | **P1-3** |
| 11. Tailwind logical | 1 file (`template/timeline/timeline.tsx`) uses `pl-/pr-/text-left` | P2-1 |
| 12. Arabic font | `Rubik` via next/font, latin+arabic subsets | OK (web), broken for PDF |
| 13. Date/number locale | `ar-SD`/`ar-SA` mixed | **P1-4** |
| 14. Zod messages | uniformly hardcoded English | **P1-2** |

Ship blockers: **P0-1, P0-2, P0-3** plus a domain verification (P0-4). After those, the four P1 items (hardcoded customs table, Zod messages, locale cookie, ar-SA→ar-SD) for parity-quality experience.
