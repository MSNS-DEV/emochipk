import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, RefreshCw, Shield, Award, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { styleCategories, genderCategories, formatPrice } from '@/lib/data';
import { createCallerFactory } from '@/server/trpc';
import { appRouter } from '@/server/root';
import { db } from '@/server/db';
import type { CatalogProduct } from '@/lib/data';

const features = [
  { icon: Truck,     title: 'Free Shipping',   description: 'On orders above PKR 5,000' },
  { icon: RefreshCw, title: '7-Day Exchange',  description: 'Easy returns & exchanges' },
  { icon: Shield,    title: 'Secure Payment',  description: 'COD · JazzCash · Raast' },
  { icon: Award,     title: 'Handcrafted',     description: 'Pasrur & Daska artisans' },
];

/** Fetch products via tRPC server caller — no HTTP round-trip */
async function getHomeProducts() {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ db, session: null });

  const [featuredRes, newRes, saleRes] = await Promise.allSettled([
    caller.product.getAll({ featured: true, pageSize: 4 }),
    caller.product.getAll({ sortBy: 'newest', pageSize: 4 }),
    caller.product.getAll({ onSale: true, pageSize: 4 }),
  ]);

  return {
    featured:    featuredRes.status === 'fulfilled' ? featuredRes.value.items : [],
    newArrivals: newRes.status === 'fulfilled'      ? newRes.value.items      : [],
    onSale:      saleRes.status === 'fulfilled'     ? saleRes.value.items     : [],
  };
}

export default async function HomePage() {
  const { featured, newArrivals, onSale } = await getHomeProducts();

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-stone-950">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent z-10" />
          <Image
            src="/images/hero-shoes.jpg"
            alt="Executive Mochi luxury footwear"
            fill
            className="object-cover object-center opacity-60"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-4 font-medium">
              Eid Collection 2026 · Pasrur &amp; Daska
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6">
              Step Into
              <br />
              <span className="text-amber-400">Executive</span>
              <br />
              Elegance
            </h1>
            <p className="text-stone-300 text-lg leading-relaxed mb-8 max-w-md">
              Premium handcrafted footwear — Peshawari, Formal Shoes, Ladies Chappal &amp; more.
              Over 500 articles, delivered nationwide with COD.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-semibold text-base px-8">
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-base px-8">
                <Link href="/size-guide">Size Guide</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES BAR ──────────────────────────────────── */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3 py-5 px-4 lg:px-6">
                <f.icon className="h-7 w-7 text-amber-500 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GENDER CATEGORIES ─────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Shop by Collection
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Gents · Ladies · Kids — crafted in Pasrur and Daska
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {genderCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent z-10" />
                <Image
                  src={cat.imageUrl}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 33vw, 50vw"
                />
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                  <h3 className="font-serif text-2xl font-bold text-white">{cat.label}</h3>
                  <span className="text-amber-400 text-sm flex items-center gap-1 mt-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Shop {cat.label} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STYLE CATEGORIES ──────────────────────────────── */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold mb-6 text-center">Browse by Style</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {styleCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?style=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border hover:border-amber-400 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-center text-foreground group-hover:text-amber-500 transition-colors leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED COLLECTION ───────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  Featured Collection
                </h2>
                <p className="text-muted-foreground">Our most sought-after styles</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link href="/shop?filter=featured">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {(featured as CatalogProduct[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button asChild variant="outline">
                <Link href="/shop?filter=featured">View All Featured</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ─── EID COLLECTION BANNER ─────────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(251,191,36,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-4 font-medium">
              Eid Special 2026
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              The Art of Pakistani Shoemaking
            </h2>
            <p className="text-stone-300 text-lg leading-relaxed mb-8">
              Generations of master craftsmen in Pasrur and Daska handcraft
              every pair — from traditional Peshawari to modern formal oxfords.
              Discover footwear made with pride, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-semibold px-8">
                <Link href="/shop">Explore Eid Collection</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ──────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  New Arrivals
                </h2>
                <p className="text-muted-foreground">Fresh additions to the collection</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link href="/shop?filter=new">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {(newArrivals as CatalogProduct[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── ON SALE ───────────────────────────────────────── */}
      {onSale.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-red-600">
                  On Sale
                </h2>
                <p className="text-muted-foreground">Limited time Eid discounts</p>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link href="/shop?filter=sale">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {(onSale as CatalogProduct[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── STORE LOCATIONS ───────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-stone-950 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-3 font-medium">Visit Us</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Two Locations, One Commitment
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Walk into our Pasrur or Daska stores and experience the craftsmanship firsthand.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { city: 'Pasrur', address: 'Timber Market, Pasrur',       landmark: 'Near Service Super Shoes' },
              { city: 'Daska',  address: 'Kachehri Road, Pasrur/Daska', landmark: 'Near Service Super Shoes' },
            ].map((store) => (
              <div key={store.city} className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg text-white">Executive Mochi – {store.city}</h3>
                    <p className="text-stone-400 text-sm mt-1">{store.address}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{store.landmark}</p>
                  </div>
                </div>
                <p className="text-stone-500 text-xs">Mon–Sat: 10:00 AM – 9:00 PM</p>
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
