# Deployment Guide

## Environments

| Environment | URL | Branch | Auto-deploy |
|-------------|-----|--------|-------------|
| Production | mazin.sd | `main` | Yes (Vercel) |
| Staging | staging.mazin.sd | `staging` | Yes (Vercel) |

## Prerequisites

- Vercel account linked to the repository
- Neon PostgreSQL project with production and staging branches
- Sentry project for error tracking
- Environment variables configured in Vercel dashboard

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | JWT encryption secret (32+ chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL (auto-detected on Vercel) | `https://mazin.sd` |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps |
| `CRON_SECRET` | Secret for cron endpoint authentication |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `OPENWEATHER_API_KEY` | OpenWeather API key for dashboard weather |

## Deployment Steps

### 1. First-time Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database (first time only)
pnpm db:push

# Seed initial data (optional)
pnpm db:seed

# Verify build
pnpm build
```

### 2. Production Deploy

Merging to `main` triggers auto-deploy on Vercel. For manual deploy:

```bash
vercel --prod
```

### 3. Staging Deploy

```bash
vercel
```

## Health Check

After deployment, verify the app is running:

```bash
curl https://mazin.sd/api/health
# Expected: { "status": "ok", "database": "ok", ... }
```

## Monitoring

### Sentry

Error tracking is configured via `@sentry/nextjs`. Errors are captured in:
- `global-error.tsx` - Root-level uncaught errors
- Server-side errors via `sentry.server.config.ts`
- Edge runtime errors via `sentry.edge.config.ts`
- Client-side errors via `sentry.client.config.ts`

### Vercel Analytics

Enable in Vercel dashboard under project settings > Analytics.

## Rollback

### Quick Rollback (Vercel)

1. Go to Vercel dashboard > Deployments
2. Find the last known good deployment
3. Click the three dots menu > "Promote to Production"

### Database Rollback

Neon supports point-in-time restore:

1. Go to Neon Console > your project > Branches
2. Create a new branch from a specific point in time
3. Update `DATABASE_URL` in Vercel to point to the new branch
4. Redeploy

## Security Headers

The following security headers are configured in `next.config.ts`:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disables camera, microphone, geolocation
- `Content-Security-Policy` - Restricts resource loading origins

## Rate Limiting

Auth endpoints are rate-limited to 10 requests per minute per IP address (configured in `src/middleware.ts`).

## Cron Jobs

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/reminders` | Daily 8:00 AM | Send task reminder notifications |

Configure in Vercel: Settings > Cron Jobs, with `CRON_SECRET` for authentication.
