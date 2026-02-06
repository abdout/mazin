# Mazin

Port Sudan customs clearance automation platform. Multi-tenant SaaS for managing shipments, customs declarations, invoices, and client tracking.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL via Prisma 7 + Neon
- **Auth**: NextAuth v5 (JWT strategy)
- **Styling**: Tailwind CSS 4, shadcn/ui
- **i18n**: Arabic (RTL, default) and English (LTR)
- **Monitoring**: Sentry error tracking
- **CI/CD**: GitHub Actions + Vercel

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT encryption secret |
| `NEXTAUTH_URL` | No | Auto-detected on Vercel |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `CRON_SECRET` | No | Cron endpoint auth secret |

See [docs/deployment.md](docs/deployment.md) for the full list.

## Scripts

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm test         # Run unit tests (Vitest)
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage
pnpm type-check   # TypeScript validation
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema changes
pnpm db:migrate   # Create and apply migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed database
```

## Architecture

```
src/
├── app/
│   ├── [lang]/              # Locale segment (ar|en)
│   │   ├── (auth)/          # Login, register, reset
│   │   ├── (platform)/      # Protected platform routes
│   │   │   ├── dashboard/   # Admin dashboard
│   │   │   ├── project/     # Project management
│   │   │   ├── finance/     # Finance module
│   │   │   ├── invoice/     # Invoicing
│   │   │   ├── customer/    # Client management
│   │   │   ├── task/        # Task management
│   │   │   └── team/        # Team management
│   │   └── track/           # Public shipment tracking
│   └── api/                 # API routes
├── actions/                 # Server actions (tracking, ACD, duty, demurrage)
├── components/
│   ├── platform/            # Feature components
│   ├── template/            # Layout templates (header, sidebar)
│   ├── ui/                  # shadcn/ui primitives
│   └── internationalization/ # i18n dictionaries and types
├── lib/
│   ├── db.ts                # Prisma client
│   ├── tracking.ts          # Tracking utilities
│   └── services/            # Business services (notifications)
└── middleware.ts             # Auth, i18n, rate limiting
```

## Domain Context

### Customs Clearance Workflow

Shipments progress through 11 stages:

1. **Pre-Arrival Docs** - Document collection (B/L, Commercial Invoice, Packing List)
2. **Vessel Arrival** - Ship arrives at Port Sudan
3. **Customs Declaration** - Submit declaration to customs authority
4. **Customs Payment** - Pay duties and taxes
5. **Inspection** - Physical cargo inspection
6. **Port Fees** - Pay port handling fees
7. **Quality Standards** - SSMO inspection for regulated goods
8. **Release** - Customs releases cargo
9. **Loading** - Load onto transport
10. **In Transit** - Transport to destination
11. **Delivered** - Cargo delivered to consignee

### Key Concepts

- **ACD**: Advance Cargo Declaration - required before cargo loading (mandatory Jan 2026)
- **HS Code**: Harmonized System code for tariff classification and duty calculation
- **Demurrage**: Storage fees charged after free days expire at port
- **SSMO**: Sudanese Standards and Metrology Organization

## Documentation

- [Deployment Guide](docs/deployment.md)
- [Database Migrations](docs/database-migrations.md)
- [Domain Knowledge](knowledge.md)
- [Document Types](docs/knowledge/document-types.md)
- [Fee Structure](docs/knowledge/fee-structure.md)
- [Workflow Stages](docs/knowledge/workflow-stages.md)

## License

Private - All rights reserved.
