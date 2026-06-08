/**
 * CloudFront CDN — signed URLs + cache invalidation.
 *
 * Heavy operations that require AWS SDK. For simple URL building (zero deps),
 * use `./cloudfront-url.ts` instead.
 *
 * Required env (only when used):
 *   - CLOUDFRONT_KEY_PAIR_ID + CLOUDFRONT_PRIVATE_KEY → signed URLs
 *   - CLOUDFRONT_DISTRIBUTION_ID → cache invalidation
 *
 * Lifted from `~/hogwarts/src/lib/cloudfront.ts`. Adapted: dropped video-specific
 * `getVideoUrl()` (Mazin doesn't have video lessons); added `getSignedAssetUrl`
 * that's intent-named for documents/photos.
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront"
import { getSignedUrl } from "@aws-sdk/cloudfront-signer"
import { logger } from "@/lib/logger"

import {
  getCloudFrontUrl,
  isCloudFrontConfigured,
  toCloudFrontUrl,
} from "./cloudfront-url"

const log = logger.forModule("storage.cloudfront")

let cfClient: CloudFrontClient | null = null

function getCloudFrontClient(): CloudFrontClient | null {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId) return null

  if (!cfClient) {
    cfClient = new CloudFrontClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    })
  }
  return cfClient
}

export { isCloudFrontConfigured, getCloudFrontUrl, toCloudFrontUrl }

function isSigningConfigured(): boolean {
  return !!(process.env.CLOUDFRONT_KEY_PAIR_ID && process.env.CLOUDFRONT_PRIVATE_KEY)
}

/**
 * Build a short-lived signed CloudFront URL for a private asset (e.g. invoice
 * PDF, POD photo). Falls back to the unsigned CloudFront URL when signing isn't
 * configured — that's safe for dev but should be flagged in prod.
 *
 * Default expiry is 1 hour: long enough for a client to download from an email
 * link, short enough that a leaked URL has limited blast radius.
 */
export function getSignedAssetUrl(
  s3KeyOrUrl: string,
  opts: { expirySeconds?: number } = {}
): string {
  const { expirySeconds = 60 * 60 } = opts
  const cfUrl = toCloudFrontUrl(s3KeyOrUrl).startsWith("http")
    ? toCloudFrontUrl(s3KeyOrUrl)
    : getCloudFrontUrl(s3KeyOrUrl)

  if (!isSigningConfigured()) {
    log.warn("CloudFront signing not configured — returning unsigned URL")
    return cfUrl
  }

  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID!
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY!
  const dateLessThan = new Date(Date.now() + expirySeconds * 1000).toISOString()

  return getSignedUrl({ url: cfUrl, keyPairId, privateKey, dateLessThan })
}

/**
 * Invalidate CloudFront cache for given paths. Use this when a doc is overwritten
 * (same key, new content) so cached old versions don't leak. Paths must start
 * with `/` per the CloudFront API.
 */
export async function invalidateCache(paths: string[]): Promise<void> {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID
  if (!distributionId || paths.length === 0) return

  const client = getCloudFrontClient()
  if (!client) return

  try {
    await client.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `mazin-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths.map((p) => (p.startsWith("/") ? p : `/${p}`)),
          },
        },
      })
    )
  } catch (err) {
    log.error("CloudFront invalidation failed", err as Error, { paths })
  }
}
