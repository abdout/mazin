# Architecture Document

## Mazin - System Architecture

---

## 1. Architecture Overview

### 1.1 Architecture Style
**Serverless Monolith** - A modern approach combining the simplicity of a monolith with serverless scalability.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 App Router                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │ [lang]/  │  │(platform)│  │  (auth)  │  │  (marketing)     │ │   │
│  │  │ layout   │  │dashboard │  │  login   │  │    landing       │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                              COMPONENTS                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │    UI    │  │   Atom   │  │ Template │  │  Block   │               │
│  │(shadcn)  │  │(composed)│  │ (layout) │  │  (data)  │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Platform Feature Modules                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │Shipments │  │ Customs  │  │ Invoices │  │Warehouse │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                              APPLICATION                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Server Actions                              │  │
│  │  actions.ts → validation.ts (Zod) → Prisma Client → Database     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         Authentication                             │  │
│  │  NextAuth v5 → Sessions → Role-Based Access Control              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Prisma 6 ORM                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │   User   │  │ Shipment │  │ Customs  │  │ Invoice  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                           INFRASTRUCTURE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Neon (Postgres)│  │ Vercel Blob │  │   Vercel    │                 │
│  │   Database    │  │   Storage   │  │   Hosting   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | latest | Component library (Radix-based) |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| TanStack Table | 8.x | Data tables |

### 2.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js Server Actions | - | Backend logic |
| NextAuth.js | 5.x | Authentication |
| Prisma | 6.x | ORM |
| bcrypt | - | Password hashing |

### 2.3 Database
| Technology | Purpose |
|------------|---------|
| Neon PostgreSQL | Serverless Postgres database |
| Prisma Migrations | Schema management |

### 2.4 Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Hosting & deployment |
| Vercel Blob | File storage |
| Vercel Analytics | Performance monitoring |

---

## 3. Component Architecture

### 3.1 Composition Hierarchy

```
FOUNDATION
├── Radix UI (Primitives)
└── shadcn/ui (Styled primitives)

COMPONENTS
├── UI Components (/components/ui/)
│   └── Button, Card, Input, Dialog, Table, etc.
│
├── Atoms (/components/atom/)
│   └── StatCard, StatusBadge, SearchBar, UserDisplay
│
├── Templates (/components/template/)
│   └── DashboardLayout, AuthLayout, PlatformHeader
│
└── Blocks (/components/block/)
    └── DataTable, FormWizard, ActivityFeed

FEATURES
└── Platform Modules (/components/platform/)
    ├── shipments/
    │   ├── content.tsx    (Server component)
    │   ├── actions.ts     (Server actions)
    │   ├── validation.ts  (Zod schemas)
    │   ├── form.tsx       (Client component)
    │   ├── table.tsx      (Client component)
    │   └── column.tsx     (Column definitions)
    ├── customs/
    ├── invoices/
    └── warehouse/
```

### 3.2 Mirror Pattern

Routes mirror component structure:

```
app/[lang]/(platform)/shipments/page.tsx
    ↓ imports
components/platform/shipments/content.tsx
    ↓ uses
components/platform/shipments/table.tsx
components/platform/shipments/form.tsx
```

---

## 4. Directory Structure

```
mazin/
├── _bmad/                      # BMAD planning docs
│   └── docs/
├── prisma/
│   ├── schema.prisma           # Main schema
│   └── models/                 # Split models
│       ├── auth.prisma
│       ├── shipment.prisma
│       ├── customs.prisma
│       └── invoice.prisma
├── src/
│   ├── app/
│   │   ├── [lang]/             # Locale routing
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   ├── (marketing)/
│   │   │   └── (platform)/
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn primitives
│   │   ├── atom/               # Composed components
│   │   ├── template/           # Layout templates
│   │   ├── block/              # Data-driven blocks
│   │   ├── platform/           # Feature modules
│   │   └── internationalization/
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── utils.ts            # Helpers (cn)
│   │   └── formatters.ts       # Number/date formatting
│   ├── hooks/
│   ├── auth.ts                 # NextAuth config
│   ├── middleware.ts           # Locale + auth
│   └── routes.ts               # Route definitions
└── config files...
```

---

## 5. Data Architecture

### 5.1 Entity Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────────────┐
│   User   │───1:n─│   Shipment   │───1:n─│CustomsDeclaration│
│          │       │              │       │                  │
│ id       │       │ id           │       │ id               │
│ email    │       │ shipmentNo   │       │ declarationNo    │
│ name     │       │ type         │       │ status           │
│ password │       │ status       │       │ hsCode           │
│ role     │       │ description  │       │ dutyAmount       │
└──────────┘       │ consignor    │       │ taxAmount        │
     │             │ consignee    │       │ currency         │
     │             │ vesselName   │       └──────────────────┘
     │             │ containerNo  │              │
     │             └──────────────┘              │1:n
     │                    │                      ▼
     │                    │1:n           ┌──────────────┐
     │                    ▼              │   Document   │
     │             ┌──────────────┐      │              │
     │             │   Invoice    │      │ id           │
     └─────1:n────►│              │      │ fileName     │
                   │ id           │      │ fileUrl      │
                   │ invoiceNo    │      │ fileType     │
                   │ status       │      └──────────────┘
                   │ currency     │
                   │ subtotal     │
                   │ tax          │
                   │ total        │
                   └──────────────┘
                          │1:n
                          ▼
                   ┌──────────────┐
                   │ InvoiceItem  │
                   │              │
                   │ id           │
                   │ description  │
                   │ quantity     │
                   │ unitPrice    │
                   │ total        │
                   └──────────────┘
```

### 5.2 Database Indexes

```prisma
@@index([shipmentNumber])     // Shipment lookup
@@index([status])             // Status filtering
@@index([userId])             // User's records
@@index([createdAt])          // Date ordering
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───►│ NextAuth │───►│  Verify  │───►│ Session  │
│   Form   │    │Credentials│   │ Password │    │ Created  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 6.2 Authorization Matrix

| Resource | Admin | Manager | Clerk | Viewer |
|----------|-------|---------|-------|--------|
| Users | CRUD | R | - | - |
| Shipments | CRUD | CRUD | CRUD | R |
| Customs | CRUD | CRUD | CRU | R |
| Approve | Yes | Yes | No | No |
| Invoices | CRUD | CRUD | CRU | R |
| Settings | CRUD | R | - | - |

### 6.3 Session Structure

```typescript
interface Session {
  user: {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'MANAGER' | 'CLERK' | 'VIEWER'
  }
}
```

---

## 7. Internationalization Architecture

### 7.1 Locale Structure

```typescript
// config.ts
export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en']
}

export const localeConfig = {
  ar: { name: 'العربية', dir: 'rtl', currency: 'SDG' },
  en: { name: 'English', dir: 'ltr', currency: 'USD' }
}
```

### 7.2 Dictionary Loading

```
Server Component (page.tsx)
    ↓ getDictionary(lang)
Content Component (content.tsx)
    ↓ dictionary prop
Client Components (table.tsx, form.tsx)
```

### 7.3 RTL/LTR Support

- Use logical CSS properties (ms-*, me-*, ps-*, pe-*)
- Tailwind RTL utilities (rtl:, ltr:)
- Arabic font: Tajawal
- English font: Inter

---

## 8. API Design

### 8.1 Server Actions Pattern

```typescript
// actions.ts
"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { shipmentSchema } from "./validation"

export async function createShipment(data: FormData) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 2. Validation
  const validated = shipmentSchema.parse(Object.fromEntries(data))

  // 3. Database operation
  const shipment = await db.shipment.create({
    data: {
      ...validated,
      userId: session.user.id
    }
  })

  // 4. Revalidate
  revalidatePath("/shipments")

  // 5. Return
  return { success: true, data: shipment }
}
```

### 8.2 Response Format

```typescript
type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
```

---

## 9. Security Architecture

### 9.1 Security Measures

| Layer | Measure |
|-------|---------|
| Transport | HTTPS/TLS encryption |
| Authentication | NextAuth with JWT sessions |
| Authorization | Role-based access control |
| Passwords | bcrypt hashing |
| Input | Zod validation |
| SQL | Prisma (parameterized queries) |
| XSS | React automatic escaping |
| CSRF | NextAuth built-in protection |

### 9.2 Environment Variables

```env
# Database
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=
AUTH_URL=

# Storage
BLOB_READ_WRITE_TOKEN=
```

---

## 10. Deployment Architecture

### 10.1 Vercel Deployment

```
┌────────────────────────────────────────────────────────┐
│                      Vercel                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Edge       │  │  Serverless │  │   Static    │    │
│  │  Functions  │  │  Functions  │  │   Assets    │    │
│  │(middleware) │  │ (actions)   │  │  (JS/CSS)   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────────────────────────────────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│   Neon Postgres │  │   Vercel Blob   │
│    (Database)   │  │    (Storage)    │
└─────────────────┘  └─────────────────┘
```

### 10.2 Environment Tiers

| Tier | Branch | URL |
|------|--------|-----|
| Production | main | mazin.vercel.app |
| Preview | PR branches | mazin-xxx.vercel.app |
| Development | local | localhost:3000 |

---

## 11. Performance Considerations

### 11.1 Optimization Strategies

- **React Server Components** - Reduce client bundle
- **Streaming** - Progressive page loading
- **ISR** - Incremental static regeneration
- **Code Splitting** - Dynamic imports
- **Image Optimization** - Next/Image
- **Connection Pooling** - Neon serverless driver

### 11.2 Caching Strategy

```typescript
// Static pages
export const revalidate = 3600 // 1 hour

// Server actions
revalidatePath("/shipments") // On mutation
```

---

## 12. Monitoring & Observability

### 12.1 Tools

- **Vercel Analytics** - Performance metrics
- **Vercel Logs** - Function logs
- **Sentry** (optional) - Error tracking

### 12.2 Key Metrics

- Page load time (LCP < 2.5s)
- Interaction time (FID < 100ms)
- Layout shifts (CLS < 0.1)
- Error rate (< 1%)

---

*Document Version: 1.0*
*Last Updated: December 2025*
