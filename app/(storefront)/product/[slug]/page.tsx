import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { styleCategories, genderCategories, getDbStyle } from '@/lib/utils/catalog';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/root';
import { db } from '@/server/db';
import { ProductDetails } from './product-details';
import { ProductCard } from '@/components/product-card';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Server-side caller for RSC data fetching (no HTTP overhead)
const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ session: null, db });

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '').trim();

  try {
    const product = await caller.product.getBySlug(decodedSlug);
    if (!product) {
      return {
        title: 'Product Not Found | Executive Mochi',
        robots: { index: false, follow: false },
      };
    }

    const styleLabel = styleCategories.find((s) => s.id === product.style)?.label ?? product.style;
    const genderLabel = genderCategories.find((g) => g.id === product.category)?.label ?? product.category;
    const title = `${product.name} | Handcrafted Pure Leather ${styleLabel}`;
    const description = `Buy ${product.name} (${product.articleNumber || ''}) online in Pakistan. 100% genuine handcrafted leather, premium ergonomic comfort & durable finish. Free shipping & COD nationwide.`;
    const canonicalUrl = `https://executivemochi.pk/product/${product.slug}`;
    const primaryImage = product.images?.[0]?.url;
    const price = product.salePrice ?? product.basePrice;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'website',
        locale: 'en_PK',
        siteName: 'Executive Mochi',
        images: primaryImage
          ? [
              {
                url: primaryImage,
                width: 1200,
                height: 1200,
                alt: product.name,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: primaryImage ? [primaryImage] : [],
      },
      other: {
        'product:price:amount': String(price),
        'product:price:currency': 'PKR',
        'product:availability': product.isActive ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'product:category': `${genderLabel} > ${styleLabel}`,
      },
    };
  } catch (err) {
    console.error(`[generateMetadata] Error fetching product "${decodedSlug}":`, err);
    return {
      title: 'Product Not Found | Executive Mochi',
      robots: { index: false, follow: false },
    };
  }
}

/** Normalize a raw URL slug: lowercase, spaces/underscores → hyphens, strip leading/trailing hyphens */
function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')   // spaces / underscores → hyphens
    .replace(/[^a-z0-9-]/g, '') // remove any remaining non-URL chars
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '').trim();

  // ── Tier 1: exact lookup with error handling ──────────────────────────
  let product = null;
  try {
    product = await caller.product.getBySlug(decodedSlug);
  } catch (err) {
    console.error(`[ProductPage] Error fetching slug "${decodedSlug}":`, err);
  }

  if (!product) {
    // ── Tier 2: slug is malformed (spaces, wrong case, etc.) ─────────────
    const cleanSlug = normalizeSlug(decodedSlug);
    if (cleanSlug && cleanSlug !== decodedSlug) {
      let cleanProduct = null;
      try {
        cleanProduct = await caller.product.getBySlug(cleanSlug);
      } catch (_err) {
        // silent catch
      }
      if (cleanProduct) {
        permanentRedirect(`/product/${cleanSlug}`);
      }
    }

    // ── Tier 3: check if product exists in DB (e.g. without images) ──────
    try {
      const bare = await db.product.findFirst({
        where: {
          OR: [
            { slug: decodedSlug },
            ...(cleanSlug && cleanSlug !== decodedSlug ? [{ slug: cleanSlug }] : []),
          ],
          isActive: true,
        },
        select: { id: true, category: true, slug: true, images: { select: { id: true } } },
      });

      if (bare && bare.images.length === 0) {
        // Product has no storefront images yet — redirect to its category shop page
        permanentRedirect(`/shop?category=${bare.category}`);
      }
    } catch (err) {
      console.error(`[ProductPage] Error checking bare product:`, err);
    }

    // ── Tier 4: truly not found ───────────────────────────────────────────
    notFound();
  }

  const styleLabel = styleCategories.find((s) => s.id === product.style)?.label ?? product.style;
  const genderLabel = genderCategories.find((g) => g.id === product.category)?.label ?? product.category;

  // ── Related products query safely wrapped ──────────────────────────────
  let relatedProducts: any[] = [];
  try {
    const dbStyle = getDbStyle(product.style) || product.style;
    const related = await caller.product.getAll({
      style: dbStyle as never,
      category: product.category as never,
      page: 1,
      pageSize: 5,
    });
    relatedProducts = related.items.filter((p: any) => p.id !== product.id).slice(0, 4);
  } catch (err) {
    console.warn(`[ProductPage] Could not fetch related products:`, err);
  }

  // Calculate review aggregation if reviews exist
  const approvedReviews = product.reviews || [];
  const reviewCount = approvedReviews.length;
  const avgRating =
    reviewCount > 0
      ? (
          approvedReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) /
          reviewCount
        ).toFixed(1)
      : null;

  // Ensure absolute URLs for Schema.org image validators
  const absoluteImages = (product.images || []).map((img: any) => {
    const url = img.url || '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://executivemochi.pk/${url.replace(/^\//, '')}`;
  });
  const productImages =
    absoluteImages.length > 0
      ? absoluteImages
      : ['https://executivemochi.pk/images/hero-shoes.jpg'];

  return (
    <div className="min-h-screen">
      {/* Structured Data (JSON-LD) */}
      <JsonLd
        id="product-ld"
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: product.name,
              image: productImages,
              description:
                product.description ||
                `Handcrafted genuine leather ${product.name} from Executive Mochi. Premium artisan footwear made in Pakistan with nationwide Cash on Delivery.`,
              sku: (product.articleNumber ?? product.id).replace(/^\d+-/, ''),
              mpn: (product.articleNumber ?? product.id).replace(/^\d+-/, ''),
              brand: {
                '@type': 'Brand',
                name: 'Executive Mochi',
              },
              category: product.category,
              ...(avgRating && reviewCount > 0
                ? {
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: avgRating,
                      reviewCount: String(reviewCount),
                      bestRating: '5',
                      worstRating: '1',
                    },
                  }
                : {}),
              ...(reviewCount > 0
                ? {
                    review: approvedReviews.slice(0, 5).map((r: any) => ({
                      '@type': 'Review',
                      reviewRating: {
                        '@type': 'Rating',
                        ratingValue: String(r.rating || 5),
                        bestRating: '5',
                      },
                      author: {
                        '@type': 'Person',
                        name: r.customer?.user?.name || 'Verified Buyer',
                      },
                      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2025-01-01',
                      reviewBody: r.comment || 'Authentic handcrafted footwear with premium leather finish.',
                    })),
                  }
                : {}),
              offers: {
                '@type': 'Offer',
                url: `https://executivemochi.pk/product/${product.slug}`,
                priceCurrency: 'PKR',
                price: Number(product.salePrice ?? product.basePrice),
                availability: product.isActive
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
                validFrom: new Date().toISOString().split('T')[0],
                priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                  .toISOString()
                  .split('T')[0],
                hasMerchantReturnPolicy: {
                  '@type': 'MerchantReturnPolicy',
                  applicableCountry: 'PK',
                  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                  merchantReturnDays: 7,
                  returnMethod: 'https://schema.org/ReturnByMail',
                  returnFees: 'https://schema.org/FreeReturn',
                },
                shippingDetails: {
                  '@type': 'OfferShippingDetails',
                  shippingRate: {
                    '@type': 'MonetaryAmount',
                    value: Number(product.salePrice ?? product.basePrice) >= 5000 ? '0' : '250',
                    currency: 'PKR',
                  },
                  shippingDestination: {
                    '@type': 'DefinedRegion',
                    addressCountry: 'PK',
                  },
                  deliveryTime: {
                    '@type': 'ShippingDeliveryTime',
                    handlingTime: {
                      '@type': 'QuantitativeValue',
                      minValue: 1,
                      maxValue: 2,
                      unitCode: 'DAY',
                    },
                    transitTime: {
                      '@type': 'QuantitativeValue',
                      minValue: 2,
                      maxValue: 4,
                      unitCode: 'DAY',
                    },
                  },
                },
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://executivemochi.pk',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Shop',
                  item: 'https://executivemochi.pk/shop',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: genderLabel,
                  item: `https://executivemochi.pk/shop?category=${product.category}`,
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: product.name,
                  item: `https://executivemochi.pk/product/${product.slug}`,
                },
              ],
            },
          ],
        }}
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-muted/40 py-3 border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-foreground transition-colors"
            >
              {genderLabel}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link
              href={`/shop?style=${product.style}`}
              className="hover:text-foreground transition-colors"
            >
              {styleLabel}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <ProductDetails product={product as never} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p as never} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
