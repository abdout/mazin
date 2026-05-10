# Mazin Database Posture Audit — Production Readiness

## 1. Prisma Schema Split — multi-file assembly is correctly wired

**Files (15 model files in `/Users/abdout/mazin/prisma/models/`):**
- `assignment.prisma` (1 model, 0 enums)
- `audit.prisma` (1 model, 1 enum)
- `auth.prisma` (7 models, 2 enums)
- `client.prisma` (1 model, 0 enums)
- `company.prisma` (1 model, 0 enums)
- `customs.prisma` (4 models, 3 enums)
- `finance.prisma` (27 models, 29 enums)
- `invite.prisma` (1 model, 1 enum)
- `invoice.prisma` (5 models, 3 enums)
- `marketplace.prisma` (4 models, 3 enums)
- `notification.prisma` (3 models, 4 enums)
- `operations.prisma` (7 models, 9 enums)
- `project.prisma` (1 model, 2 enums)
- `shipment.prisma` (3 models, 5 enums)
- `task.prisma` (1 model, 3 enums)

**Totals: 67 models, 65 enums.**

**Assembly mechanism:** `/Users/abdout/mazin/prisma.config.ts:54` — `schema: path.join("prisma")` points at the *directory*, which is the multi-file feature. `/Users/abdout/mazin/prisma/schema.prisma:5-12` only contains generator + datasource (no `previewFeatures = ["prismaSchemaFolder"]` needed in Prisma 7 since the dir-based config supersedes it).

**Verdict — P2 / OK.** Multi-file assembly via `prisma.config.ts` is the correct Prisma 7 pattern. `package.json` does not (and need not) declare a `prisma.schema` key.

---

## 2. Migrations vs db push — CRITICAL GAP

**Migration folders:** **1** (`/Users/abdout/mazin/prisma/migrations/20251226074540_add_auth_schema/migration.sql`).

**Coverage:** That migration declares **8 tables** (`users`, `accounts`, `sessions`, `verification_tokens`, `password_reset_tokens`, `two_factor_tokens`, `two_factor_confirmations`, `shipments`, `customs_declarations`, `documents`, `invoices`, `invoice_items`) and **6 enums**. Schema currently defines **67 models / 65 enums** — i.e. **~88% of models have NO migration**.

**Workflow signal:**
- `package.json:11` — `"db:push": "prisma db push"` is present.
- `README.md:30` instructs `pnpm db:push` for setup.
- `docs/production-readiness-epics.md:124-126` confirms internally: *"Move from `prisma db push` workflow to proper `prisma migrate` discipline ... Only 1 migration exists ... while the live Neon DB has ~85 tables created by `db push` ... No rollback path."*

**Verdict — P0.** Schema-as-source-of-truth is broken; environment bootstrap from migrations cannot reproduce production. (Note: the epics doc says "126 models" but the actual count today is 67 — either the doc is stale or models were collapsed.)

---

## 3. FK integrity — multiple critical raw-string FKs

| Field | Location | Type | Verdict |
|---|---|---|---|
| `AuditLog.actorId` | `prisma/models/audit.prisma:24` | `String?` (raw, no `@relation`) | **P0** |
| `StaffInvite.invitedBy` | `prisma/models/invite.prisma:19` | `String` (raw) | **P0** |
| `StaffInvite.acceptedBy` | `prisma/models/invite.prisma:22` | `String?` (raw) | **P0** |
| `CustomsDeclaration.approvedBy` | `prisma/models/customs.prisma:26` | `String?` (raw) | **P0** |
| `AdvanceCargoDeclaration.validatedBy` | `prisma/models/customs.prisma:96` | `String?` (raw) | **P0** |
| `Vendor.approvedBy` | `prisma/models/marketplace.prisma:42` | `String?` (raw) | **P0** |
| `Expense.approvedBy` | `prisma/models/finance.prisma:533` | `String?` (raw — duplicate of `approvedById` `@relation` at `:549-550`) | **P0** + dup |
| `Expense.rejectedBy` | `prisma/models/finance.prisma:535` | `String?` (raw) | **P0** |
| `Payroll.processedBy` | `prisma/models/finance.prisma:761` | `String?` raw (vs `PayrollRun.processedById` `:802-803` which is `@relation`) | **P0** |
| `FiscalYear.closedBy` | `prisma/models/finance.prisma:1121` | `String?` raw | **P0** |
| `Transaction.invoiceId` | `prisma/models/finance.prisma:380` | `String?` (raw, no relation) | **P0** |
| `Transaction.payrollId` | `prisma/models/finance.prisma:382` | `String?` (raw) | **P0** |
| `Transaction.shipmentId` | `prisma/models/finance.prisma:383` | `String?` (raw) | **P0** |
| `Transaction.clientId` | `prisma/models/finance.prisma:384` | `String?` (raw) | **P0** |
| `Project.team String[]` | `prisma/models/project.prisma:20` | array of strings; **no join table** | **P0** |
| `Task.assignedTo String[]` | `prisma/models/task.prisma:18` | array of strings; **no join table** | **P0** |

The internal epic at `docs/production-readiness-epics.md:150-161` already enumerates exactly this list as Story 2.4 (open).

**Verdict — P0.** Orphan accumulation is guaranteed; `String[]` arrays for team/assignedTo cannot be enforced or joined by Postgres at all.

---

## 4. Indexes — 5 largest models

**By line count, the 5 largest models are: `Invoice`, `Shipment`, `Expense`, `Transaction`, `PayrollItem`.**

| Model | `@@index` declarations | File:line |
|---|---|---|
| `Invoice` | `[invoiceNumber]`, `[status]`, `[userId]`, `[clientId]`, `[invoiceType]` | `prisma/models/invoice.prisma:129-133` |
| `Shipment` | `[shipmentNumber]`, `[trackingNumber]`, `[trackingSlug]`, `[status]`, `[userId]`, `[clientId]`, `[createdAt]` | `prisma/models/shipment.prisma:63-69` |
| `Expense` | `[userId]`, `[categoryId]`, `[expenseDate]`, `[status]`, `[shipmentId]`, `[submittedById]` | `prisma/models/finance.prisma:573-578` |
| `Transaction` | `[userId]`, `[bankAccountId]`, `[transactionDate]`, `[type]`, `[category]` | `prisma/models/finance.prisma:402-406` |
| `PayrollItem` | `[payrollId]`, `[payrollRunId]`, `[employeeId]`, `[status]` | `prisma/models/finance.prisma:879-882` |

**High-cardinality fields lacking secondary indexes:**
- `Invoice.blNumber` (`invoice.prisma:93`) — searched in clearance flows; **no index**. P1.
- `Invoice.declarationNo` (`invoice.prisma:96`) — no index. P1.
- `Shipment.containerNumber` (`shipment.prisma:16`) and `Invoice.containerNumbers String[]` (`invoice.prisma:94`) — no index. P1.
- `Transaction.invoiceId/payrollId/shipmentId/clientId` (`finance.prisma:380-384`) — none indexed (and none have FK either). **P0** (compounded with §3).

`Shipment.trackingNumber` *is* indexed (`shipment.prisma:64`) and `clientId` *is* indexed (`:68`) — those specific concerns from the prompt are covered.

---

## 5. Multi-tenancy — README claim is FALSE

**README.md:3** states: *"Multi-tenant SaaS for managing shipments..."*

**Reality:** Searched `prisma/models/` for `tenantId|schoolId|organizationId` — **zero hits**. There is no tenant column anywhere in the Mazin schema. Tenancy is reduced to per-`userId` ownership (effectively each User is their own silo, not multi-tenant in the SaaS sense).

The doc `src/components/platform/finance/banking/INTEGRATION_COMPLETE.md` references `schoolId` columns and a "Hogwarts" tenant model — that file is **stale copy-paste from a different project (databayt school SaaS)**, not reflective of Mazin's actual schema. There is no `prisma/models/banking.prisma`, no `prisma/models/school.prisma`, and no `schoolId` field anywhere in `prisma/models/`.

`src/components/platform/finance/receipt/actions.ts:43` confirms: `schoolId: "", // legacy shape — single-tenant, always empty`.

**Models WITHOUT a tenant column = ALL 67 models.** The schema is single-tenant (per-user ownership), period.

**Verdict — P0.** Either fix the marketing copy or rebuild the schema with a `Tenant`/`Organization` model and FK every business row to it. Right now a paying customer 2 cannot be onboarded without polluting customer 1's data, except through the User-as-pseudo-tenant fiction.

---

## 6. Soft delete — entirely absent

`grep deletedAt /Users/abdout/mazin/prisma/models/*.prisma` returns **zero hits**. None of the requested models (`Client`, `Shipment`, `Invoice`, `Project`, `Task`, `Container`, `CustomsDeclaration`, `User`) — or any other model — declare `deletedAt DateTime?`. The internal Story 2.6 (`docs/production-readiness-epics.md:169-174`) lists exactly those eight as the soft-delete gap.

**Verdict — P1.** Hard deletes only. Compliance claims (audit trail, undo) cannot be honored.

---

## 7. NotificationPriority enum casing — LOWERCASE (inconsistent)

`prisma/models/notification.prisma:33-38`:
```
enum NotificationPriority {
  low
  normal
  high
  urgent
}
```

Every other enum in the codebase (`UserRole`, `InvoiceStatus`, `ShipmentStatus`, `AuditAction`, etc.) is **UPPERCASE**. `Notification.priority` defaults to `normal` (`notification.prisma:69`). Already flagged internally as Story 2.3 (`docs/production-readiness-epics.md:143-148`).

**Verdict — P1.** Cosmetic in isolation but a foot-gun for client codegen and Postgres `ALTER TYPE` migrations once data exists.

---

## 8. AuditLog model — no retention, no purge

**Schema** (`prisma/models/audit.prisma:20-40`):
- Fields: `id`, `action`, `actorId`, `actorEmail`, `resource`, `resourceId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`.
- Indexes: `[actorId, createdAt]`, `[resource, resourceId]`, `[action, createdAt]`.
- **No `retention_days`, `expiresAt`, partitioning hint, or TTL column.**

**Cron purge:** Vercel crons declared in `vercel.json` are only `/api/cron/reminders` and `/api/cron/demurrage`. `grep auditLog.deleteMany` across `src/` returns no results. **No purge cron exists.** Internal Story 2.7 (`docs/production-readiness-epics.md:176-181`) acknowledges this.

`AuditLog` itself is wired in code: written in `src/lib/audit.ts:22` and read in `src/components/platform/settings/security/audit-log-list.tsx:23`.

**Verdict — P1 (data growth bomb).** The table will grow unbounded with every login attempt.

---

## 9. IdempotencyKey model — DOES NOT EXIST

`grep -rn "IdempotencyKey\|idempotencyKey" /Users/abdout/mazin/prisma/` returns no hits. Internal Story 2.8 (`docs/production-readiness-epics.md:183-187`) flags it as missing.

The closest thing in schema is `JobRun` (`prisma/models/operations.prisma:284-298`), which gives idempotency for **scheduled cron jobs only** via `@@unique([jobName, scheduledFor])`. No idempotency layer exists for **user-facing payment-creating server actions** — meaning a double-click on "Submit payment" could double-charge.

**Verdict — P1 financial correctness.** `JobRun` exists (good); `IdempotencyKey` for human-driven mutations is missing.

---

## 10. FileRecord / Upload model — EXISTS, fully wired

`FileRecord` is declared at `prisma/models/operations.prisma:311-337` with fields `id`, `s3Key` (unique), `url`, `contentType`, `size`, `sha256`, `kind`, `uploadedById` + `@relation` to User, `access` (`FileAccess` enum: `public|private`), `originalName`, `metadata`, `createdAt`, `updatedAt`. Indexes on `[uploadedById, createdAt]` and `[kind, createdAt]`.

User has back-relation: `auth.prisma:86` — `fileRecords FileRecord[]`.

Wired in code:
- `src/lib/storage/upload.ts:75` — `db.fileRecord.findFirst` (sha256 dedupe).
- `src/lib/storage/upload.ts:113` — `db.fileRecord.create` (S3 PUT then row insert).
- `src/lib/storage/upload.ts:147, :166` — find/delete on file removal.
- `src/__tests__/lib/storage/upload.test.ts:33-135` — extensive test coverage.

**Note:** there is `enum FileAccess { public; private }` at `operations.prisma:339-342` — same lowercase casing inconsistency as `NotificationPriority`.

**Verdict — Story 0.1 STATUS = SHIPPED.** Model exists, has indexes, has FK back-relation, and is referenced by both production code and tests.

---

## 11. Prisma client setup — `src/lib/db.ts`

| Aspect | Status | Notes |
|---|---|---|
| Singleton via `globalForPrisma` | ✅ correct | `:12-14, :28, :30` |
| Adapter | ✅ Neon | `@prisma/adapter-neon` (`:2`), instantiated at `:18-20` |
| `ws` constructor for Node | ✅ guarded | `:8-10` only sets when `globalThis.WebSocket` undefined |
| Connection pool sizing | ❌ **NOT configured** | `new PrismaNeon({ connectionString })` — no `max`, no `connectionLimit`, default pool only |
| `log` levels | ✅ env-gated | `:24` |
| `@prisma/adapter-pg` | listed in `package.json:60` but **NOT imported** in `src/lib/db.ts` — adapter-neon is the only one wired |
| HMR-safe (skip global in prod) | ✅ | `:30` |

**Verdict — P1 (pool sizing).** On Vercel serverless, missing `max` per-connection cap can exhaust Neon connection limits under load. Singleton is correctly implemented.

---

## P0 / P1 / P2 Roll-Up

### P0 — must fix before any "production" claim
- **§2** Migration baseline missing — `prisma/migrations/` has 1 folder; schema has 67 models. `package.json:11` still scripts `db:push`.
- **§3** Raw-String FKs across `AuditLog.actorId` (`audit.prisma:24`), `StaffInvite.invitedBy/acceptedBy` (`invite.prisma:19,22`), `CustomsDeclaration.approvedBy` (`customs.prisma:26`), `AdvanceCargoDeclaration.validatedBy` (`customs.prisma:96`), `Vendor.approvedBy` (`marketplace.prisma:42`), `Expense.approvedBy/rejectedBy` (`finance.prisma:533,535`), `Payroll.processedBy` (`finance.prisma:761`), `FiscalYear.closedBy` (`finance.prisma:1121`), `Transaction.{invoiceId,payrollId,shipmentId,clientId}` (`finance.prisma:380-384`).
- **§3** `Project.team String[]` (`project.prisma:20`) and `Task.assignedTo String[]` (`task.prisma:18`) need join tables.
- **§4** `Transaction.invoiceId/payrollId/shipmentId/clientId` (`finance.prisma:380-384`) lack both FK and index — P0 compound.
- **§5** README claims "multi-tenant SaaS" but **zero models have `tenantId`/`schoolId`/`organizationId`**. The `INTEGRATION_COMPLETE.md` claiming `schoolId` was added is a stale copy-paste from a sibling repo and does not match `prisma/models/finance.prisma`.

### P1 — required for honest GA
- **§4** Missing indexes on `Invoice.blNumber` (`invoice.prisma:93`), `Invoice.declarationNo` (`:96`), `Shipment.containerNumber` (`shipment.prisma:16`), `Invoice.containerNumbers` (`invoice.prisma:94`).
- **§6** No `deletedAt` on any of the 67 models — soft-delete entirely absent.
- **§7** `NotificationPriority` lowercase (`notification.prisma:33-38`); `FileAccess` lowercase (`operations.prisma:339-342`) — inconsistent with rest.
- **§8** `AuditLog` has no retention column and no purge cron — `vercel.json` only schedules `reminders` + `demurrage`.
- **§9** No `IdempotencyKey` model — only `JobRun` covers cron idempotency, not user-facing payment actions.
- **§11** `PrismaNeon` adapter has no `max` pool size in `src/lib/db.ts:18-20`.

### P2 — quality polish
- **§1** Prisma multi-file assembly is correct (`prisma.config.ts:54`); kept here only as confirmation.
- **§3** `Expense.approvedBy` (raw at `finance.prisma:533`) **and** `Expense.approvedById` (relation at `:549-550`) coexist — choose one. Same dual pattern: `submittedBy` (`:531`) vs `submittedById` (`:546-547`), `rejectionReason` (`:536`) vs `rejectedReason` (`:537`).
- **§10** `FileRecord` model is fully wired and shipped — no action needed.

### Distinguishing "exists in schema" vs "wired into code"
| Model | In schema | Used in code |
|---|---|---|
| `AuditLog` | ✓ `audit.prisma:20` | ✓ `src/lib/audit.ts:22`, `src/components/platform/settings/security/audit-log-list.tsx:23` |
| `JobRun` | ✓ `operations.prisma:284` | ✓ `src/lib/jobs/lock.ts:61,83,90`, tests in `src/__tests__/jobs/` |
| `FileRecord` | ✓ `operations.prisma:311` | ✓ `src/lib/storage/upload.ts:75,113,147,166` + tests |
| `IdempotencyKey` | ✗ | n/a |
| `tenantId`/`schoolId` columns | ✗ (despite `INTEGRATION_COMPLETE.md` claims) | partial stub: `src/components/platform/finance/receipt/actions.ts:43` writes empty string |
