# Database Migrations Guide

## Overview

Mazin uses Prisma 7 with Neon PostgreSQL. Schema files are split across `prisma/models/*.prisma` for organization, with the main configuration in `prisma/schema.prisma`.

## Schema Files

| File | Contents |
|------|----------|
| `schema.prisma` | Datasource and generator config |
| `models/auth.prisma` | User, Account, Session, VerificationToken |
| `models/shipment.prisma` | Shipment, TrackingStage |
| `models/project.prisma` | Project and related entities |
| `models/invoice.prisma` | Invoice, InvoiceItem, StageInvoice |
| `models/client.prisma` | Client management |
| `models/customs.prisma` | CustomsDeclaration, Document, ACD, HsCode |
| `models/task.prisma` | Task management |
| `models/notification.prisma` | Notification, WhatsApp messages |
| `models/finance.prisma` | BankAccount, Expense, Payroll, Receipt |
| `models/company.prisma` | Company settings |
| `models/assignment.prisma` | User assignments |

## Commands

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Push schema to database (development - no migration history)
pnpm db:push

# Create a migration (production - with migration history)
pnpm db:migrate

# Open Prisma Studio (visual database editor)
pnpm db:studio

# Seed database
pnpm db:seed
```

## Development Workflow

### Adding a New Model

1. Create or edit the appropriate file in `prisma/models/`
2. Add relations to related models (both sides)
3. Run `pnpm db:generate` to update the Prisma client
4. Run `pnpm db:push` to apply to your dev database
5. Verify with `pnpm db:studio`

### Modifying Existing Models

1. Edit the model in `prisma/models/`
2. Run `pnpm db:generate`
3. Run `pnpm db:push` (development) or `pnpm db:migrate` (production)

## Neon Branching

Neon supports database branching, useful for testing schema changes safely.

### Create a Test Branch

1. Go to Neon Console > Branches
2. Click "Create Branch" from `main`
3. Copy the new branch connection string
4. Set `DATABASE_URL` to the branch connection string
5. Run `pnpm db:push` against the branch
6. Test your changes
7. If satisfied, apply to `main` branch
8. Delete the test branch

### Production Migrations

For production schema changes:

```bash
# 1. Create a migration file
pnpm db:migrate --name descriptive_name

# 2. Review the generated SQL in prisma/migrations/
# 3. Apply to production via Vercel deploy (automatic)
```

## Backup & Restore

### Neon Point-in-Time Restore

Neon automatically retains history. To restore:

1. Go to Neon Console > Branches
2. Create a new branch from a point in time
3. Verify data integrity on the new branch
4. Switch `DATABASE_URL` to the restored branch if needed

### Manual Backup

```bash
# Export data using pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260101.sql
```

## Common Patterns

### Adding Indexes

```prisma
model Example {
  // ...
  @@index([fieldName])           // Single field
  @@index([field1, field2])      // Composite
  @@unique([field1, field2])     // Unique constraint
}
```

### Decimal Fields (Money)

```prisma
amount Decimal @db.Decimal(15, 2)  // 15 digits, 2 decimal places
```

### Soft Delete

```prisma
deletedAt DateTime?
@@index([deletedAt])
```

### Enum Usage

```prisma
enum Status {
  ACTIVE
  INACTIVE
}

model Example {
  status Status @default(ACTIVE)
}
```
