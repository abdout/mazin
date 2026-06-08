/**
 * Lightweight CloudFront URL helpers — zero AWS SDK dependencies.
 *
 * Pure functions that only read env + do string ops, so they can be imported
 * without pulling `@aws-sdk/*` into the bundle. Heavy operations (signing,
 * invalidation) stay in `./cloudfront.ts`.
 *
 * Lifted from `~/hogwarts/src/lib/cloudfront-url.ts`. Adapted: dropped Vercel-blob
 * pass-through (Mazin doesn't use it).
 */

/**
 * Returns true when CloudFront domain OR S3 bucket is available, since
 * `getCloudFrontUrl()` falls back to a direct S3 URL when CloudFront is unset.
 */
export function isCloudFrontConfigured(): boolean {
  return !!(process.env.CLOUDFRONT_DOMAIN || process.env.AWS_S3_BUCKET)
}

/**
 * Build a CloudFront URL from an S3 key. Falls back to a raw `s3.amazonaws.com`
 * URL when `CLOUDFRONT_DOMAIN` is not set (useful for local dev with just LocalStack).
 */
export function getCloudFrontUrl(s3Key: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) {
    const bucket = process.env.AWS_S3_BUCKET
    const region = process.env.AWS_REGION || "us-east-1"
    if (!bucket) return s3Key
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`
  }
  return `https://${domain}/${s3Key}`
}

/**
 * Convert any URL to its CloudFront equivalent when possible.
 * - S3 URLs → CloudFront URL
 * - Already-CloudFront URLs → pass through
 * - External URLs (youtube etc.) → pass through
 */
export function toCloudFrontUrl(url: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN
  if (!domain) return url
  if (url.includes(domain)) return url

  const s3Match = url.match(/https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/)
  if (s3Match) return `https://${domain}/${s3Match[1]}`

  return url
}

/**
 * Inverse — extract the S3 key from a CloudFront / S3 URL. Returns the input
 * unchanged when it doesn't match, so callers can pass either a URL or a raw key.
 */
export function extractKeyFromUrl(urlOrKey: string): string {
  try {
    const url = new URL(urlOrKey)
    return url.pathname.replace(/^\//, "")
  } catch {
    return urlOrKey
  }
}
