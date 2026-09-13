import Link from 'next/link';
import { Search, Home, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppButton } from '@/components/whatsapp-button';

export default function NotFound() {
  const popularCategories = [
    { label: 'Gents Collection', href: '/shop?category=MEN', emoji: '👞' },
    { label: 'Ladies Footwear', href: '/shop?category=WOMEN', emoji: '👡' },
    { label: 'Peshawari Chappals', href: '/shop?style=PESHAWARI', emoji: '✨' },
    { label: 'Leather Loafers', href: '/shop?style=LOAFERS', emoji: '👞' },
    { label: 'Formal Oxfords', href: '/shop?style=OXFORD', emoji: '👔' },
    { label: 'Kids & Youth', href: '/shop?category=KIDS', emoji: '🎒' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-stone-950 text-white">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-6">
            <span>Error 404 · Page or Article Not Found</span>
          </div>

          {/* Big visual number */}
          <h1 className="font-serif text-7xl sm:text-9xl font-bold tracking-tight text-amber-500/90 mb-4">
            404
          </h1>

          <h2 className="font-serif text-2xl sm:text-4xl font-semibold mb-4 text-stone-100">
            The Article You Are Looking For Is Not Available
          </h2>

          <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto mb-8 leading-relaxed">
            The page may have moved, the shoe model may be sold out, or the URL address was mistyped.
            You can search our catalog or explore our bestselling handcrafted leather collections below.
          </p>

          {/* Quick Search Form */}
          <div className="max-w-md mx-auto mb-10">
            <form action="/shop" method="GET" className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="search"
                name="search"
                placeholder="Search handcrafted shoes, articles, or styles..."
                className="w-full pl-10 pr-24 py-3 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Popular Categories */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-3">
              Popular Footwear Collections
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-xs font-medium text-stone-300 hover:text-white hover:border-amber-500 transition-all"
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition-colors shadow-lg"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Explore Entire Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 font-semibold text-sm hover:bg-stone-800 hover:text-white transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Return to Homepage</span>
            </Link>
            <a
              href="https://wa.me/923006314988?text=Hello%20Executive%20Mochi,%20I%20am%20looking%20for%20a%20specific%20shoe%20model"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Ask via WhatsApp</span>
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
