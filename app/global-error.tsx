'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError caught at root]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0c0a09] text-white flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
            EM
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-100">
            Executive Mochi
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            We are currently experiencing a brief technical interruption. Our team has been notified.
            Please refresh the page or reach out directly to our artisan support.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white font-semibold text-sm transition-colors inline-block"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
