import type { MetadataRoute } from 'next';
import { db } from '@/server/db';
import pg from 'pg';

export const revalidate = 3600; // Cache sitemap for 1 hour to prevent DB connection spikes

async function fetchProductsForSitemap(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    if (products && products.length > 0) {
      return products;
    }
  } catch (err: any) {
    // Prisma query engine may fail on non-standard architectures; fall back to pg
  }

  try {
    const dbUrl =
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_si9fM8gyAZCx@ep-young-scene-a1czywn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

    const pool = new pg.Pool({ connectionString: dbUrl });
    try {
      const res = await pool.query(
        `SELECT slug, "updatedAt" FROM products WHERE "isActive" = true ORDER BY "updatedAt" DESC`
      );
      return res.rows.map((r: any) => ({
        slug: r.slug,
        updatedAt: new Date(r.updatedAt),
      }));
    } finally {
      await pool.end();
    }
  } catch (pgErr) {
    console.error('[sitemap] Failed to fetch products via pg fallback:', pgErr);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://executivemochi.pk').replace(/\/$/, '');

  // 1. Static Core Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/craftsmanship`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Product URLs (All active products from database)
  const products = await fetchProductsForSitemap();
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
