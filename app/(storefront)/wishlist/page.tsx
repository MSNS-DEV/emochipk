'use client';

import Link from 'next/link';
import { Heart, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  // Wishlist would be managed via context/state in a real app
  const wishlistItems: never[] = [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            My Wishlist
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {wishlistItems.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-3">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground mb-8">
              Save your favorite items here to buy them later or share with friends.
            </p>
            <Button asChild size="lg">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Products would be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
}
