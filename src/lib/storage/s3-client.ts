/**
 * Lazy-initialized S3 client.
 *
 * Lifted from `~/hogwarts/src/components/file/providers/aws-s3.ts`. Adapted:
 * collapsed the multi-provider abstraction to a single S3 client (Mazin doesn't
 * use Cloudflare R2). The provider-pattern remains in place via `./providers/`
 * so swapping to R2 later is a single-file change.
 *
 * Required env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET.
 */

import { S3Client } from "@aws-sdk/client-s3"

let s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const region = process.env.AWS_REGION || "us-east-1"

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS S3 credentials are not configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
      )
    }

    s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  }
  return s3Client
}

export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set")
  }
  return bucket
}

/**
 * Build the canonical raw S3 URL for a key. Most callers should prefer
 * `getCloudFrontUrl()` from `./cloudfront-url`, which falls back to this when
 * `CLOUDFRONT_DOMAIN` isn't set.
 */
export function getS3Url(key: string): string {
  const bucket = getBucketName()
  const region = process.env.AWS_REGION || "us-east-1"
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}
