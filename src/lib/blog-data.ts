/**
 * Static blog data for marketing insights section
 * This provides featured articles for the homepage insights component
 */

export interface BlogArticle {
  slug: string
  image: string
  publishedAt: string
}

// Featured articles for homepage insights section
// Slugs must match the keys in dictionary.marketing.insights.articles
const featuredArticles: BlogArticle[] = [
  {
    slug: 'sudan-customs-digital-system',
    image: '/digital.jpg',
    publishedAt: '2025-10-15',
  },
  {
    slug: 'red-sea-shipping-crisis',
    image: '/red-sea.jpg',
    publishedAt: '2025-12-20',
  },
  {
    slug: 'port-sudan-operations-update',
    image: '/operation.jpg',
    publishedAt: '2025-12-18',
  },
]

export function getFeaturedArticles(): BlogArticle[] {
  return featuredArticles
}

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return featuredArticles.find((article) => article.slug === slug)
}
