import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  getCloudFrontUrl,
  toCloudFrontUrl,
  extractKeyFromUrl,
  isCloudFrontConfigured,
} from "@/lib/storage/cloudfront-url"

const ORIGINAL_ENV = { ...process.env }

describe("cloudfront-url helpers", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.CLOUDFRONT_DOMAIN
    delete process.env.AWS_S3_BUCKET
    delete process.env.AWS_REGION
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("getCloudFrontUrl prefers CLOUDFRONT_DOMAIN", () => {
    process.env.CLOUDFRONT_DOMAIN = "dXXX.cloudfront.net"
    expect(getCloudFrontUrl("uid/avatars/abc.png")).toBe(
      "https://dXXX.cloudfront.net/uid/avatars/abc.png"
    )
  })

  it("getCloudFrontUrl falls back to raw S3 when CloudFront is unset", () => {
    process.env.AWS_S3_BUCKET = "mazin-prod"
    process.env.AWS_REGION = "us-east-1"
    expect(getCloudFrontUrl("foo/bar.pdf")).toBe(
      "https://mazin-prod.s3.us-east-1.amazonaws.com/foo/bar.pdf"
    )
  })

  it("getCloudFrontUrl returns the raw key when nothing is configured", () => {
    expect(getCloudFrontUrl("just-a-key")).toBe("just-a-key")
  })

  it("toCloudFrontUrl rewrites S3 → CloudFront when domain is set", () => {
    process.env.CLOUDFRONT_DOMAIN = "dXXX.cloudfront.net"
    expect(
      toCloudFrontUrl("https://mazin-prod.s3.us-east-1.amazonaws.com/uid/x.pdf")
    ).toBe("https://dXXX.cloudfront.net/uid/x.pdf")
  })

  it("toCloudFrontUrl passes already-CloudFront URLs through", () => {
    process.env.CLOUDFRONT_DOMAIN = "dXXX.cloudfront.net"
    expect(toCloudFrontUrl("https://dXXX.cloudfront.net/uid/x.pdf")).toBe(
      "https://dXXX.cloudfront.net/uid/x.pdf"
    )
  })

  it("extractKeyFromUrl peels the path from an absolute URL", () => {
    expect(
      extractKeyFromUrl("https://dXXX.cloudfront.net/uid/avatars/abc.png")
    ).toBe("uid/avatars/abc.png")
  })

  it("extractKeyFromUrl returns input when not a URL", () => {
    expect(extractKeyFromUrl("uid/avatars/abc.png")).toBe("uid/avatars/abc.png")
  })

  it("isCloudFrontConfigured is true when either CF or S3 bucket is set", () => {
    expect(isCloudFrontConfigured()).toBe(false)
    process.env.AWS_S3_BUCKET = "mazin-prod"
    expect(isCloudFrontConfigured()).toBe(true)
  })
})
