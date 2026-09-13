'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShoppingBag, MessageCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error monitor
    console.error('[GlobalError Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-950 text-white">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-stone-100">
          Temporary Catalog Interruption
        </h1>

        <p className="text-sm text-stone-400 max-w-md mx-auto mb-8 leading-relaxed">
          We encountered an unexpected issue while loading this page. Our technical team has been
          notified. Please try refreshing or continue exploring our handcrafted shoes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition-colors shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Refreshing</span>
          </button>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 font-semibold text-sm hover:bg-stone-800 hover:text-white transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Browse Catalog</span>
          </Link>
          <a
            href="https://wa.me/923006314988?text=Hello%20Executive%20Mochi,%20I%20encountered%20an%20error%20on%20your%20website"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
