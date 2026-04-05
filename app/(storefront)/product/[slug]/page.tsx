import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { styleCategories, genderCategories } from '@/lib/utils/catalog';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/root';
import { db } from '@/server/db';
import { ProductDetails } from './product-details';
import { ProductCard } from '@/components/product-card';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Server-side caller for RSC data fetching (no HTTP overhead)
const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ session: null, db });

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await caller.product.getBySlug(slug);
    if (!product) return { title: 'Product Not Found' };
    return {
      title: `${product.name} – ${product.articleNumber} | Executive Mochi`,
      description: product.description.substring(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.substring(0, 160),
        images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await caller.product.getBySlug(slug);

  if (!product) notFound();

  const styleLabel = styleCategories.find((s) => s.id === product.style)?.label ?? product.style;
  const genderLabel = genderCategories.find((g) => g.id === product.category)?.label ?? product.category;

  // Related: same style, same category
  const related = await caller.product.getAll({
    style: product.style as never,
    category: product.category as never,
    page: 1, pageSize: 5,
  });
  const relatedProducts = related.items.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-muted/40 py-3 border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href={`/shop?category=${product.category}`} className="hover:text-foreground transition-colors">
              {genderLabel}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link href={`/shop?style=${product.style}`} className="hover:text-foreground transition-colors">
              {styleLabel}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <ProductDetails product={product as never} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as never} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
