# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mazin is a Port Sudan customs clearance automation platform. Multi-tenant SaaS for managing shipments, customs declarations, invoices, and client tracking. Supports Arabic (RTL, default) and English (LTR).

## Commands

```bash
# Development
pnpm dev                # Start dev server with Turbopack (localhost:3000)
pnpm build              # Generate Prisma client + build Next.js
pnpm lint               # Run ESLint

# Database (PostgreSQL via Neon)
pnpm db:generate        # Generate Prisma client
pnpm db:push            # Push schema changes (no migration)
pnpm db:migrate         # Create and apply migrations
pnpm db:studio          # Open Prisma Studio
pnpm db:seed            # Seed database (npx tsx prisma/seed.ts)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1 (App Router, Turbopack)
- **React**: 19.x with Server Components
- **Database**: PostgreSQL via Prisma 7 with `@prisma/adapter-pg` and `pg` pool
- **Auth**: NextAuth v5 beta (`next-auth@5.0.0-beta.30`) with JWT strategy + Prisma adapter
- **Styling**: Tailwind CSS 4, shadcn/ui
- **i18n**: Dictionary-based JSON files (`ar.json`, `en.json`)

### Key Patterns

**i18n Routing**: All routes under `[lang]` segment. Middleware detects locale from `NEXT_LOCALE` cookie or Accept-Language header. Default: `ar`.

```typescript
// Server component
import { getDictionary } from '@/components/internationalization/dictionaries'
const dict = await getDictionary(lang) // Locale from params
```

**RTL Support**:
```typescript
import { getDir, isRTL } from '@/components/internationalization/config'
const dir = getDir(locale) // 'rtl' | 'ltr'
```

**Authentication**: JWT sessions. Route protection in `src/middleware.ts` using definitions from `src/routes.ts`:
- `publicRoutes`: Marketing pages, `/track/*`
- `authRoutes`: `/login`, `/register` (redirects logged-in users)
- All other routes require authentication

**Database**: Prisma with connection pooling via `pg` adapter. Import from `@/lib/db`:
```typescript
import { db } from '@/lib/db'
```

Models split across `prisma/models/*.prisma` files (auth, shipment, invoice, client, customs, etc.).

**Path Aliases** (single alias):
```typescript
@/*  →  src/*
```

### Tracking Stages

Shipments progress through 11 stages (defined in `TrackingStageType` enum):
```
PRE_ARRIVAL_DOCS → VESSEL_ARRIVAL → CUSTOMS_DECLARATION → CUSTOMS_PAYMENT →
INSPECTION → PORT_FEES → QUALITY_STANDARDS → RELEASE → LOADING → IN_TRANSIT → DELIVERED
```

Each stage has status: `PENDING | IN_PROGRESS | COMPLETED | SKIPPED`

## Domain Knowledge

Port Sudan customs clearance system. Key concepts:

- **ACD (Advance Cargo Declaration)**: Required before cargo loading at origin (mandatory Jan 2026). Generates ACN number shown on B/L.
- **IM Form**: Bank import form for foreign currency allocation
- **SSMO**: Sudanese Standards and Metrology Organization inspection certificates

See `knowledge.md` for complete domain documentation including regulatory requirements, workflow diagrams, and automation opportunities.
