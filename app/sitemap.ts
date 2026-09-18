import type { MetadataRoute } from 'next';
import pg from 'pg';

export const revalidate = 3600; // Cache sitemap for 1 hour to prevent DB connection spikes

async function fetchProductsForSitemap(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  // 1. Direct PG pooler query (fastest, zero binary engine dependency)
  try {
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (dbUrl) {
      const pool = new pg.Pool({ connectionString: dbUrl });
      try {
        const res = await pool.query(
          `SELECT slug, "updatedAt" FROM products WHERE "isActive" = true ORDER BY "updatedAt" DESC`
        );
        if (res.rows && res.rows.length > 0) {
          return res.rows.map((r: any) => ({
            slug: r.slug,
            updatedAt: new Date(r.updatedAt),
          }));
        }
      } finally {
        await pool.end().catch(() => {});
      }
    }
  } catch (pgErr) {
    console.warn('[sitemap] PG query fallback to Prisma:', pgErr);
  }

  // 2. Prisma Client fallback (lazy loaded)
  try {
    const { db } = await import('@/server/db');
    const products = await db.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (products && products.length > 0) {
      return products;
    }
  } catch (_err: unknown) {
    // Both failed
  }

  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://executivemochi.pk').replace(/\/$/, '');
  const now = new Date();

  // 1. Static Core Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/craftsmanship`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stores`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shipping`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Primary Footwear Category Routes (FR-SEO-01)
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/shop?category=MEN`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shop?category=WOMEN`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shop?category=KIDS`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/shop?category=ACCESSORIES`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
  ];

  // 3. Footwear Style Taxonomy Routes (FR-SEO-01)
  const styleRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/shop?style=OXFORD`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=LOAFERS`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=MOCCASINS`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=PESHAWARI`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=SANDALS`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=SNEAKERS`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop?style=SCHOOL`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 4. Brand Landing Pages (FR-SEO-01)
  const brandRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/shop?brand=Executive%20Mochi`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/shop?brand=Bata`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/shop?brand=Servis`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/shop?brand=Super%20Shoes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  // 5. Product URLs (All active products from database)
  const products = await fetchProductsForSitemap();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug))
    .map((product) => {
      const cleanSlug = product.slug.trim().toLowerCase().replace(/[\s_]+/g, '-');
      return {
        url: `${baseUrl}/product/${cleanSlug}`,
        lastModified: product.updatedAt || now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...styleRoutes,
    ...brandRoutes,
    ...productRoutes,
  ];
}
