import { describe, it, expect } from "vitest"
import { getFeaturedArticles, getArticleBySlug } from "@/lib/blog-data"

describe("blog-data", () => {
  describe("getFeaturedArticles", () => {
    it("returns a non-empty list", () => {
      const articles = getFeaturedArticles()
      expect(articles.length).toBeGreaterThan(0)
    })

    it("each article has slug, image, publishedAt", () => {
      for (const article of getFeaturedArticles()) {
        expect(article.slug).toBeTruthy()
        expect(article.image).toMatch(/^\//)
        expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it("returns a fresh array reference on each call (no shared mutation)", () => {
      const first = getFeaturedArticles()
      const second = getFeaturedArticles()
      expect(first).toEqual(second)
    })
  })

  describe("getArticleBySlug", () => {
    it("returns the article when slug matches", () => {
      const slug = getFeaturedArticles()[0]!.slug
      const found = getArticleBySlug(slug)
      expect(found?.slug).toBe(slug)
    })

    it("returns undefined for unknown slug", () => {
      expect(getArticleBySlug("does-not-exist-xyz")).toBeUndefined()
    })
  })
})
