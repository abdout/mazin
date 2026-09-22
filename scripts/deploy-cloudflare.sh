#!/usr/bin/env bash
# mazin (abdoutgroup.com) → Cloudflare Containers. Builds the Next standalone server on the
# Mac, wraps it in a COPY-only linux/amd64 image, smokes it locally, deploys it behind the
# Worker in cf/worker.js. Ported from kun's scripts/deploy-cloudflare.sh.
#
#   scripts/deploy-cloudflare.sh <env-file> build|smoke|deploy|all
#
# <env-file>  a dotenv with the PRODUCTION values. Non-secret vars are baked into the image
#             as env.json; secrets go to the Worker via scripts/cf-secrets.sh.
# CF_SOURCE=<ref>|head|worktree  what to build (default head). CF_OVERLAY="a b": files over the export.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=${1:?dotenv with production values}; MODE=${2:-all}
ENV_FILE=$(cd "$(dirname "$ENV_FILE")" && pwd)/$(basename "$ENV_FILE")
BUILD_DIR=${CF_BUILD_DIR:-${TMPDIR:-/tmp}/mazin-cf-build}
IMAGE=mazin-cf:local

build() {
  local SOURCE=${CF_SOURCE:-head}
  rm -rf "$BUILD_DIR"; mkdir -p "$BUILD_DIR"
  if [[ "$SOURCE" == "worktree" ]]; then
    echo "==> copying the WORKING TREE ($(git rev-parse --short HEAD) + uncommitted changes) to $BUILD_DIR"
    rsync -a --exclude node_modules --exclude .next --exclude .source --exclude .vercel --exclude .wrangler \
      --exclude .git --exclude coverage --exclude playwright-report --exclude test-results ./ "$BUILD_DIR/" \
      || { rc=$?; [[ $rc == 23 || $rc == 24 ]] && echo "    (rsync $rc: files changed under us — another session is editing; continuing)" || exit $rc; }
  else
    local REF=$SOURCE; [[ "$REF" == "head" ]] && REF=HEAD
    echo "==> exporting $REF ($(git rev-parse --short "$REF")) to $BUILD_DIR"
    git archive "$REF" | tar -x -C "$BUILD_DIR"
    for f in ${CF_OVERLAY:-}; do mkdir -p "$BUILD_DIR/$(dirname "$f")"; cp -R "$f" "$BUILD_DIR/$f"; echo "    overlay: $f"; done
  fi
  cp .env "$BUILD_DIR/.env"                       # prisma.config.ts loads it; prod values override it below
  cd "$BUILD_DIR"

  echo "==> installing"
  pnpm install --frozen-lockfile --prefer-offline --silent

  echo "==> next build (standalone) with $ENV_FILE"
  export CF_CONTAINER=1 NODE_OPTIONS="--max-old-space-size=${CF_HEAP_MB:-3072}" NEXT_TELEMETRY_DISABLED=1 NEXT_BUILD_CPUS=${NEXT_BUILD_CPUS:-2}
  node cf/env-split.mjs "$ENV_FILE" run -- pnpm run build   # prisma generate && next build
  [[ -f .next/standalone/server.js ]] || { echo "ABORT: .next/standalone/server.js missing"; exit 1; }
  [[ -e .next/standalone/node_modules/.prisma/client ]] && echo "    traced: prisma client" || echo "    WARNING: prisma client not traced into standalone"

  echo "==> assembling: baked non-secret config"
  node cf/env-split.mjs "$ENV_FILE" config > .next/standalone/env.json
  echo "    env.json: $(node -e 'console.log(Object.keys(require("./.next/standalone/env.json")).length)') config vars; $(node cf/env-split.mjs "$ENV_FILE" secrets | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(Object.keys(JSON.parse(s)).length))') secrets stay with the Worker"
  du -sh .next/standalone .next/static public | sed 's/^/    /'
}

smoke() {
  cd "$BUILD_DIR"
  # Dockerfile.cf COPYs .cf-deploy-stamp as its last layer. Only deploy() wrote it, so a smoke
  # on a fresh build dir failed the COPY — and `docker build | tail` hid it, because the
  # pipeline exits with tail's status, not docker's. Write the stamp here too, and check the
  # build's real exit status through PIPESTATUS.
  date -u +%FT%TZ > .cf-deploy-stamp
  echo "==> docker build (linux/amd64, COPY-only)"
  docker build --platform linux/amd64 -f Dockerfile.cf -t "$IMAGE" . 2>&1 | tail -3
  [[ ${PIPESTATUS[0]} -eq 0 ]] || { echo "ABORT: docker build failed"; exit 1; }
  local DENV; DENV=$(mktemp -t mazin-smoke.XXXXXX); trap 'rm -f "$DENV"' RETURN
  node cf/env-split.mjs "$ENV_FILE" docker > "$DENV"
  [[ -n "${SMOKE_DATABASE_URL:-}" ]] && printf 'DATABASE_URL=%s\n' "$SMOKE_DATABASE_URL" >> "$DENV"
  docker rm -f mazin-cf-smoke >/dev/null 2>&1 || true
  echo "==> docker run :3300 (DATABASE_URL host: $(grep -E '^DATABASE_URL=' "$DENV" | tail -1 | sed -E 's#.*@([^/:]+).*#\1#'))"
  docker run -d --rm --name mazin-cf-smoke --platform linux/amd64 -p 3300:3000 --memory 1g --env-file "$DENV" "$IMAGE" >/dev/null
  for i in $(seq 1 90); do curl -sf -o /dev/null http://localhost:3300/api/health && break; sleep 2; done
  echo "    boot: ${i}×2s"
  for p in /api/health / /en /ar /en/about /ar/services /en/track /en/login /ar/login /en/dashboard /robots.txt /api/cron/reminders; do
    printf "    %-32s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url} %{time_total}s' "http://localhost:3300$p")"
  done
  printf "    %-32s %s\n" "host abdoutgroup.com /en" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -H 'Host: abdoutgroup.com' http://localhost:3300/en)"
  echo "==> memory after the probes: $(docker stats --no-stream --format '{{.MemUsage}} ({{.MemPerc}})' mazin-cf-smoke)"
  echo "==> container log tail"; docker logs --tail 15 mazin-cf-smoke 2>&1 | sed 's/^/    /'
  docker stop mazin-cf-smoke >/dev/null
}

deploy() {
  cd "$BUILD_DIR"
  # A byte-identical image does not restart the running container, so Worker vars and
  # secrets pushed since the last deploy would never reach it. The stamp is the image's
  # last (tiny) layer: every deploy is a new image, and the instance restarts with the
  # current env. Only that layer is pushed when nothing else changed.
  date -u +%FT%TZ > .cf-deploy-stamp
  echo "==> wrangler deploy (builds + pushes the image; needs Workers Paid; stamp $(cat .cf-deploy-stamp))"
  pnpm exec wrangler deploy
}

case "$MODE" in
  build) build ;;
  smoke) smoke ;;
  deploy) deploy ;;
  all) build; smoke; deploy ;;
  *) echo "mode must be build|smoke|deploy|all"; exit 2 ;;
esac
echo "==> done ($MODE)"
