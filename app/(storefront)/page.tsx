import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  RefreshCw,
  Shield,
  Award,
  MapPin,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductShelf } from '@/components/product-shelf';
import { CategorySlideshow } from '@/components/category-slideshow';
import { HeroProductMarquee } from '@/components/hero-product-marquee';
import { styleCategories, genderCategories } from '@/lib/data';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/root';
import { db } from '@/server/db';
import type { CatalogProduct } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Executive Mochi | Luxury Handcrafted Footwear Pakistan',
  },
  description:
    'Discover 100% genuine handcrafted leather shoes from Pakistan. Master-crafted formal Oxfords, casual Loafers, Moccasins, and traditional Peshawari Chappals with nationwide Cash on Delivery.',
  alternates: {
    canonical: 'https://executivemochi.pk',
  },
  openGraph: {
    title: 'Executive Mochi | Luxury Handcrafted Footwear Pakistan',
    description:
      'Shop master-crafted genuine leather shoes, loafers, and Peshawari chappals. Free shipping over PKR 5,000 & 7-day doorstep exchange.',
    url: 'https://executivemochi.pk',
    type: 'website',
  },
};

export const revalidate = 60; // Revalidate home page every 60s to pick up newly uploaded product images

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders above PKR 5,000' },
  { icon: RefreshCw, title: '7-Day Exchange', description: 'Doorstep size & style exchange' },
  { icon: Shield, title: 'Secure Payment', description: 'COD · JazzCash · Raast · Card' },
  { icon: Award, title: 'Handcrafted', description: 'Pasrur & Ghakhar master artisans' },
];

/** Fetch products via tRPC server caller — no HTTP round-trip */
async function getHomeProducts() {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ db, session: null });

  const [featuredRes, kidsRes, menRes, womenRes, accRes] = await Promise.allSettled([
    caller.product.getAll({ featured: true, hasImages: true, pageSize: 30 }),
    caller.product.getAll({ category: 'KIDS', hasImages: true, pageSize: 40 }),
    caller.product.getAll({ category: 'MEN', hasImages: true, pageSize: 40 }),
    caller.product.getAll({ category: 'WOMEN', hasImages: true, pageSize: 40 }),
    caller.product.getAll({ category: 'ACCESSORIES', hasImages: true, pageSize: 40 }),
  ]);

  return {
    featured: featuredRes.status === 'fulfilled' ? featuredRes.value.items : [],
    kidsCollection: kidsRes.status === 'fulfilled' ? kidsRes.value.items : [],
    menCollection: menRes.status === 'fulfilled' ? menRes.value.items : [],
    womenCollection: womenRes.status === 'fulfilled' ? womenRes.value.items : [],
    accCollection: accRes.status === 'fulfilled' ? accRes.value.items : [],
  };
}

export default async function HomePage() {
  const {
    featured,
    kidsCollection,
    menCollection,
    womenCollection,
    accCollection,
  } = await getHomeProducts();

  const categoryImages: Record<string, string[]> = {
    MEN: [],
    WOMEN: [],
    KIDS: [],
    ACCESSORIES: [],
  };

  const allFetchedProducts = [
    ...featured,
    ...menCollection,
    ...womenCollection,
    ...kidsCollection,
    ...accCollection,
  ] as unknown as CatalogProduct[];

  // Collect 1 primary image per unique product to ensure visual variety across categories
  const seenProductIds = new Set<string>();
  const categoryBuckets: Record<string, string[]> = {
    MEN: [],
    WOMEN: [],
    KIDS: [],
    ACCESSORIES: [],
  };
  const secondaryImages: string[] = [];

  allFetchedProducts.forEach((prod) => {
    if (!prod.images || prod.images.length === 0) return;

    // Build category slide buckets for category slideshows (1 primary image per product, up to 10 products)
    const primaryImg = prod.images.find((img) => img?.isPrimary)?.url || prod.images[0]?.url;
    if (primaryImg && prod.category && categoryImages[prod.category] !== undefined && categoryImages[prod.category].length < 10) {
      if (!categoryImages[prod.category].includes(primaryImg)) {
        categoryImages[prod.category].push(primaryImg);
      }
    }

    if (prod.id && seenProductIds.has(prod.id)) return;
    if (prod.id) seenProductIds.add(prod.id);

    // Pick 1 primary image for this product
    if (primaryImg) {
      const cat = prod.category && categoryBuckets[prod.category] ? prod.category : 'MEN';
      categoryBuckets[cat].push(primaryImg);
    }

    // Keep secondary images in fallback pool
    prod.images.slice(1).forEach((img) => {
      if (img?.url) secondaryImages.push(img.url);
    });
  });

  // Interleave primary images round-robin across categories for hero marquee
  const interleavedHeroImages: string[] = [];
  const maxBucketLen = Math.max(
    categoryBuckets.MEN.length,
    categoryBuckets.WOMEN.length,
    categoryBuckets.KIDS.length,
    categoryBuckets.ACCESSORIES.length
  );

  for (let i = 0; i < maxBucketLen; i++) {
    if (categoryBuckets.MEN[i]) interleavedHeroImages.push(categoryBuckets.MEN[i]);
    if (categoryBuckets.WOMEN[i]) interleavedHeroImages.push(categoryBuckets.WOMEN[i]);
    if (categoryBuckets.KIDS[i]) interleavedHeroImages.push(categoryBuckets.KIDS[i]);
    if (categoryBuckets.ACCESSORIES[i]) interleavedHeroImages.push(categoryBuckets.ACCESSORIES[i]);
  }

  // Combine interleaved primary images with fallback secondary images if list is small
  const heroImagesPool = Array.from(new Set([...interleavedHeroImages, ...secondaryImages]));
  const heroImages = heroImagesPool.slice(0, 48);

  // Helper to filter valid photographed items and prioritize featured masterpieces first
  const prepareShelfProducts = (items: unknown[]): CatalogProduct[] => {
    const valid = (items as CatalogProduct[]).filter(
      (p) => p.images && p.images.length > 0 && p.images.some((img) => img?.url)
    );
    // Sort featured items to front so homepage shelves highlight bestsellers
    return [...valid].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)).slice(0, 16);
  };

  const featuredShelfProducts = prepareShelfProducts(featured);
  const menShelfProducts = prepareShelfProducts(menCollection);
  const womenShelfProducts = prepareShelfProducts(womenCollection);
  const kidsShelfProducts = prepareShelfProducts(kidsCollection);
  const accShelfProducts = prepareShelfProducts(accCollection);

  return (
    <>
      {/* ─── HERO — EXECUTIVE MOCHI BROWN & GOLD LUXURY THEME ─────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-stone-950 text-white border-b border-border/40">
        {/* Animated product images scrolling in background */}
        <HeroProductMarquee images={heroImages} />

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            {/* Eyebrow — animated fade-up */}
            <div
              className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/30 rounded-full px-4 py-1.5 mb-8 text-amber-300 text-xs font-semibold backdrop-blur-md"
              style={{ animation: 'hero-fade-up 0.7s ease both' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Pasrur &amp; Ghakhar · Since 1985</span>
            </div>

            {/* Main heading — each line staggered */}
            <h1 className="font-serif font-bold tracking-tight leading-[1.05] mb-8">
              <span
                className="block text-5xl sm:text-7xl lg:text-8xl text-white"
                style={{ animation: 'hero-fade-up 0.7s 0.1s ease both' }}
              >
                Step Into
              </span>
              <span
                className="block text-5xl sm:text-7xl lg:text-8xl bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent"
                style={{ animation: 'hero-fade-up 0.7s 0.22s ease both' }}
              >
                Executive
              </span>
              <span
                className="block text-5xl sm:text-7xl lg:text-8xl text-stone-200"
                style={{ animation: 'hero-fade-up 0.7s 0.34s ease both' }}
              >
                Elegance
              </span>
            </h1>

            {/* Minimal tagline */}
            <p
              className="text-stone-400 text-sm sm:text-base mb-10 tracking-wide"
              style={{ animation: 'hero-fade-up 0.7s 0.46s ease both' }}
            >
              Pure leather · Handcrafted · Cash on Delivery nationwide
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4"
              style={{ animation: 'hero-fade-up 0.7s 0.58s ease both' }}
            >
              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-base px-8 py-6 shadow-xl hover:scale-105 transition-all">
                <Link href="/shop">
                  Shop Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-white/25 text-white bg-transparent hover:bg-white/10 hover:text-white text-base px-8 py-6 backdrop-blur-sm">
                <Link href="/shop?filter=featured">Featured Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES BAR ──────────────────────────────────── */}
      <section className="border-b bg-secondary/30 border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/60">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3 py-5 px-4 lg:px-6">
                <f.icon className="h-7 w-7 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED MASTERPIECES SHELF (DIRECT PAYOFF FOR HERO CTA) ───────── */}
      {featuredShelfProducts.length > 0 && (
        <ProductShelf
          title="Featured Masterpieces"
          subtitle="Our most prestigious handcrafted footwear, selected by master artisans for distinction and luxury."
          badgeText="Curator's Choice"
          badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
          viewAllHref="/shop?filter=featured"
          viewAllText="View All Featured"
          products={featuredShelfProducts}
          variant="default"
        />
      )}

      {/* ─── GENDER CATEGORIES (VISUAL GATEWAY) ─────────────────────────────── */}
      <section className="py-14 sm:py-18 bg-secondary/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Shop by Collection
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Gents · Ladies · Kids · Accessories — crafted with master precision in Pasrur &amp; Ghakhar
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {genderCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900 border border-border"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent z-10" />
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  <CategorySlideshow
                    images={categoryImages[cat.id] || []}
                    fallbackUrl={cat.imageUrl}
                    alt={cat.label}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">{cat.label}</h3>
                  <span className="text-amber-300 text-xs sm:text-sm flex items-center gap-1 mt-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-medium">
                    Shop {cat.label} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 1. MEN'S LUXURY HANDCRAFTED LEATHER SHELF (HORIZONTAL SCROLL) ───── */}
      <ProductShelf
        title="Men's Luxury Handcrafted Leather"
        subtitle="Oxfords, Loafers, Moccasins, Peshawari Chappals — crafted for distinction and enduring elegance."
        badgeText="Pasrur & Ghakhar Mastercraft"
        badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
        viewAllHref="/shop?category=MEN"
        viewAllText="View All Men"
        products={menShelfProducts}
        variant="muted"
      />

      {/* ─── STYLE CATEGORIES ─────────────────────────────────────────────── */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold mb-6 text-center">Browse by Style</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {styleCategories.map((cat) => {
              const dbStyle = (cat as { dbStyle?: string }).dbStyle ?? cat.id;
              return (
                <Link
                  key={cat.id}
                  href={`/shop?style=${dbStyle}`}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border hover:border-primary hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-2xl sm:text-3xl">{cat.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors leading-tight">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 2. WOMEN'S COLLECTION SHELF (HORIZONTAL SCROLL) ────────────────── */}
      <ProductShelf
        title="Women's Footwear Collection"
        subtitle="Comfort Chappals, Pumps, Casuals, Khussas — handcrafted with cushioned footbeds and supple genuine leather."
        badgeText="Pure Comfort & Grace"
        badgeIcon={<Award className="h-3.5 w-3.5" />}
        viewAllHref="/shop?category=WOMEN"
        viewAllText="View All Women"
        products={womenShelfProducts}
        variant="default"
      />

      {/* ─── 3. KIDS' COLLECTION & SCHOOL SHOES ──────────────────────────────── */}
      <section className="pt-14 sm:pt-18 bg-gradient-to-b from-secondary/40 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 rounded-3xl p-6 sm:p-10 text-white mb-6 relative overflow-hidden shadow-2xl border border-amber-500/20">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <GraduationCap className="w-64 h-64 text-amber-400" />
            </div>

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-stone-950 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider mb-4">
                <Sparkles className="h-3.5 w-3.5" /> Back-To-School Uniform Collection
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                Kids School Shoes &amp; Uniform Footwear
              </h2>

              <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-6">
                Get your children ready for school with premium durable handcrafted school shoes from Pasrur and Ghakhar! Made with extra durability, flexible rubber soles, and arch support by our skilled artisans.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-200 mb-8">
                <div className="flex items-center gap-1.5 bg-stone-900/80 p-2.5 rounded-lg border border-white/10">
                  <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Real Leather Upper</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/80 p-2.5 rounded-lg border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Non-Slip Soles</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/80 p-2.5 rounded-lg border border-white/10">
                  <Award className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Pasrur Handcrafted</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/80 p-2.5 rounded-lg border border-white/10">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>All Uniform Sizes</span>
                </div>
              </div>

              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold px-8">
                <Link href="/shop?category=KIDS">
                  Explore All Kids School Shoes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kids Shelf with Horizontal Scroll */}
      <ProductShelf
        title="Kids' Footwear & School Shoes"
        subtitle="School Shoes, Sneakers, Casual Sandals — built tough for daily adventures with flexible, non-slip soles."
        badgeText="Uniform & Everyday Wear"
        badgeIcon={<GraduationCap className="h-3.5 w-3.5" />}
        viewAllHref="/shop?category=KIDS"
        viewAllText="View All Kids"
        products={kidsShelfProducts}
        variant="muted"
        className="pt-2 sm:pt-4"
      />

      {/* ─── CRAFTSMANSHIP HERITAGE BANNER ─────────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-4 font-semibold">
              Handcrafted in Pasrur &amp; Ghakhar
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-white">
              The Heritage of Pakistani Shoemaking
            </h2>
            <p className="text-stone-300 text-lg leading-relaxed mb-8">
              Generations of master craftsmen in Pasrur and Ghakhar handcraft
              every pair — from traditional Peshawari to modern formal oxfords and kids school shoes.
              Discover footwear made with pride, delivered nationwide with Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold px-8">
                <Link href="/shop">Explore Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8">
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SHOE CARE & ACCESSORIES SHELF (HORIZONTAL SCROLL) ───────────── */}
      <ProductShelf
        title="Shoe Care & Accessories"
        subtitle="Polishes, Shiners, Creams, Socks, Insoles — essential care kits to maintain and extend your footwear's lifespan."
        badgeText="Preserve & Protect"
        badgeIcon={<ShieldCheck className="h-3.5 w-3.5" />}
        viewAllHref="/shop?category=ACCESSORIES"
        viewAllText="View All Accessories"
        products={accShelfProducts}
        variant="default"
      />

      {/* ─── STORE LOCATIONS ───────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-stone-950 text-white border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-3 font-medium">Visit Us</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Two Outlets in Pasrur &amp; Ghakhar
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Walk into our Pasrur or Ghakhar stores and experience the craftsmanship firsthand.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { city: 'Pasrur', address: 'Timber Market, Pasrur', landmark: 'Near Service Super Shoes' },
              { city: 'Ghakhar', address: 'GT Road, Ghakhar Mandi', landmark: 'Near Service Super Shoes' },
            ].map((store) => (
              <div key={store.city} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg text-white">Executive Mochi – {store.city}</h3>
                    <p className="text-stone-300 text-sm mt-1">{store.address}</p>
                    <p className="text-stone-400 text-xs mt-0.5">{store.landmark}</p>
                  </div>
                </div>
                <p className="text-stone-400 text-xs">Mon–Sat: 10:00 AM – 9:00 PM</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800">
              <Link href="/stores">
                <MapPin className="mr-2 h-4 w-4" />
                Get Directions
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
