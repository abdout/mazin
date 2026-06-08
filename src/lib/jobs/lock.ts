/**
 * Cron job idempotency wrapper.
 *
 * Vercel can fire the same scheduled job more than once (network retry, edge-vs-region
 * duplication, manual operator runs). Without a lock the demurrage and reminders crons
 * would resend WhatsApp/email twice. `withJobLock` claims a row in `JobRun` keyed by
 * `(jobName, scheduledFor)`; conflicts short-circuit with `SKIPPED` instead of running
 * the body again.
 *
 * Bucketing: `scheduledFor` is normalized to the cron's natural granularity (top of
 * the hour for hourly, midnight for daily). Two runs inside the same bucket dedup.
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const log = logger.forModule("jobs.lock");

export type JobBucket = "hour" | "day";

export interface WithJobLockOpts<T> {
  /** Stable identifier — e.g. "cron-demurrage-daily". */
  jobName: string;
  /** Granularity of the lock window. */
  bucket?: JobBucket;
  /** Optional explicit timestamp instead of `now()` bucket. */
  scheduledFor?: Date;
  /** The work to run while the lock is held. */
  run: (ctx: { jobRunId: string; scheduledFor: Date }) => Promise<T>;
  /** Free-form metadata persisted on success/failure. */
  metadata?: Record<string, unknown>;
}

export interface JobLockResult<T> {
  status: "ran" | "skipped" | "failed";
  scheduledFor: Date;
  jobRunId?: string;
  result?: T;
  error?: string;
}

/**
 * Truncate `now` to the start of the current bucket so all retries within the
 * window collide on the same `scheduledFor` and unique-constraint short-circuit.
 */
function bucketStart(now: Date, bucket: JobBucket): Date {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  if (bucket === "day") d.setHours(0);
  return d;
}

export async function withJobLock<T>(opts: WithJobLockOpts<T>): Promise<JobLockResult<T>> {
  const bucket: JobBucket = opts.bucket ?? "day";
  const scheduledFor = opts.scheduledFor ?? bucketStart(new Date(), bucket);

  // Try to claim the slot. Unique on (jobName, scheduledFor) means a duplicate firing
  // throws P2002 — we treat that as a benign skip.
  let jobRun;
  try {
    jobRun = await db.jobRun.create({
      data: {
        jobName: opts.jobName,
        scheduledFor,
        status: "RUNNING",
        metadata: opts.metadata as never,
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      log.info("Job already claimed for this bucket — skipping", {
        jobName: opts.jobName,
        scheduledFor: scheduledFor.toISOString(),
      });
      return { status: "skipped", scheduledFor };
    }
    throw err;
  }

  try {
    const result = await opts.run({ jobRunId: jobRun.id, scheduledFor });
    await db.jobRun.update({
      where: { id: jobRun.id },
      data: { status: "SUCCESS", completedAt: new Date() },
    });
    return { status: "ran", scheduledFor, jobRunId: jobRun.id, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.jobRun.update({
      where: { id: jobRun.id },
      data: { status: "FAILED", completedAt: new Date(), error: message },
    });
    log.error("Job body threw", err as Error, { jobName: opts.jobName });
    return { status: "failed", scheduledFor, jobRunId: jobRun.id, error: message };
  }
}

/**
 * Build a deterministic dedup key for a `Notification` insert. Same key across retries
 * collides on `Notification.dedupKey` unique constraint and silently no-ops.
 */
export function notificationDedupKey(parts: {
  kind: string;
  resourceId: string;
  bucketDay?: Date;
  channel?: string;
}): string {
  const day = parts.bucketDay ?? new Date();
  const dayStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
  const channel = parts.channel ?? "ANY";
  return `${parts.kind}:${parts.resourceId}:${dayStr}:${channel}`;
}
