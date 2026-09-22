#!/usr/bin/env bash
# Deploy abdoutgroup.com on the containerless $0 lane: vinext builds the app into one
# Worker + Static Assets (cf/vinext-worker.js adds the crons). No container, no Workers
# Cache, no KV data cache, no Cloudflare Images — each of those bills.
#   scripts/deploy-cloudflare.sh [build|deploy|all]
# Secrets (DATABASE_URL, DIRECT_URL, AUTH_SECRET, CRON_SECRET) live on the Worker —
# push them with scripts/cf-secrets.sh. Assets must stay under 25 MiB each.
set -euo pipefail
STEP=${1:-all}
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_API_TOKEN:?export CLOUDFLARE_API_TOKEN first}"
export CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-ce9a5376d149c808a0b97072421ba12f}

build() {
  pnpm install --frozen-lockfile
  pnpm exec prisma generate
  pnpm run build:vinext
  local big; big=$(find dist/client -size +25M)
  [ -z "$big" ] || { echo "asset over 25 MiB: $big" >&2; exit 1; }
}
deploy() { pnpm exec wrangler deploy --config dist/server/wrangler.json; }

case "$STEP" in
  build) build ;;
  deploy) deploy ;;
  all) build; deploy ;;
esac
