import { MetadataRoute } from 'next'
import { db } from '@/server/db'
type ProductCategory = 'MEN' | 'WOMEN' | 'KIDS'
type Style = 'LOAFERS' | 'OXFORD' | 'MOCCASINS' | 'PESHAWARI' | 'SANDALS' | 'SNEAKERS'

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
  const productRoutes = (products as any[]).map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Category routes (Canonical query-param routes)
  const categories: ProductCategory[] = ['MEN', 'WOMEN', 'KIDS']
  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/shop?category=${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Style routes (Key landing segments)
  const styles: Style[] = ['LOAFERS', 'OXFORD', 'MOCCASINS', 'PESHAWARI', 'SANDALS', 'SNEAKERS']
  const styleRoutes = styles.map((style) => ({
    url: `${baseUrl}/shop?style=${style}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...styleRoutes, ...productRoutes]
}
