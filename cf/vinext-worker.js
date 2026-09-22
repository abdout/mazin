// mazin (abdoutgroup.com) on the containerless $0 lane — vinext's Worker entry
// serves the app; this wrapper only adds the cron triggers the container lane had.
import { AsyncLocalStorage } from "node:async_hooks"
import handler from "vinext/server/fetch-handler"
import crons from "./crons.json"

// One scope object per request. src/lib/db.ts keys its Prisma client on it: a Neon
// WebSocket opened in one request hangs when a later request touches it.
const scope = new AsyncLocalStorage()
globalThis.__mazinRequestScope = scope

export default {
  ...handler,
  fetch: (request, env, ctx) => scope.run({}, () => handler.fetch(request, env, ctx)),

  async scheduled(controller, env, ctx) {
    const paths = crons.schedules[controller.cron] ?? []
    const run = async (path) => {
      const started = Date.now()
      try {
        const res = await scope.run({}, () => handler.fetch(
          new Request("https://abdoutgroup.com" + path, {
            headers: { authorization: "Bearer " + env.CRON_SECRET, "user-agent": "cloudflare-cron/1" },
          }),
          env,
          ctx
        ))
        console.log(JSON.stringify({ cron: controller.cron, path, status: res.status, ms: Date.now() - started }))
      } catch (e) {
        console.error(JSON.stringify({ cron: controller.cron, path, error: String(e) }))
      }
    }
    ctx.waitUntil((async () => { for (const p of paths) await run(p) })())
  },
}
