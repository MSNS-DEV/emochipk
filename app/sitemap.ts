import { MetadataRoute } from 'next'
import { db } from '@/server/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://executivemochi.pk'

  // Fetch all active products
  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
    },
  })

  // Static routes
  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/craftsmanship',
    '/stores',
    '/contact',
    '/faqs',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
    '/size-guide',
    '/careers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Product routes
  const productRoutes = products.map((product: any) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Category routes (based on the ProductCategory enum)
  const categories = ['MEN', 'WOMEN', 'KIDS']
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/shop/${category.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
