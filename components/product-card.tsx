'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/data';
import {
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
  getProductColors,
} from '@/lib/data';

interface ProductCardProps {
  product: CatalogProduct;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const primaryImage  = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const discountPct   = getDiscountPercent(product);
  const effectivePrice = getEffectivePrice(product);
  const colors        = getProductColors(product).slice(0, 4);

  const styleLabelMap: Record<string, string> = {
    SANDALS:   'Chappal / Sandals',
    PESHAWARI: 'Peshawari',
    SNEAKERS:  'Jogger / Sneakers',
    OXFORD:    'Formal Shoe',
    LOAFERS:   'Loafer',
    MOCCASINS: 'Moccasin',
  };

  return (
    <div className={cn('group relative', className)}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900">
        <Link href={`/product/${product.slug}`}>
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            // Placeholder when no image is uploaded yet
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
              <span className="text-5xl">
                {product.style === 'SANDALS'   ? '🩴' :
                 product.style === 'PESHAWARI' ? '🥿' :
                 product.style === 'SNEAKERS'  ? '👟' :
                 '👞'}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{product.articleNumber}</span>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discountPct && (
            <Badge className="bg-red-500 text-white font-semibold text-xs px-2 py-0.5">
              -{discountPct}%
            </Badge>
          )}
          {product.isFeatured && !discountPct && (
            <Badge className="bg-amber-400 text-stone-950 font-semibold text-xs px-2 py-0.5">
              Featured
            </Badge>
          )}
        </div>

        {/* Article No Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[10px] font-mono bg-black/50 text-white/80 rounded px-1.5 py-0.5 backdrop-blur-sm">
            {product.articleNumber}
          </span>
        </div>

        {/* Wishlist */}
        <div className="absolute top-2.5 right-2.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full shadow-md bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm hover:bg-white"
          >
            <Heart className="h-3.5 w-3.5" />
            <span className="sr-only">Add to wishlist</span>
          </Button>
        </div>

        {/* Quick View */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            asChild
            size="sm"
            className="w-full bg-stone-950/90 hover:bg-stone-950 text-white backdrop-blur-sm text-xs"
          >
            <Link href={`/product/${product.slug}`}>
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
              View & Select Size
            </Link>
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-3 space-y-1.5">
        {/* Color Swatches */}
        {colors.length > 1 && (
          <div className="flex items-center gap-1.5">
            {colors.map((color) => (
              <div
                key={color.name}
                className="h-3.5 w-3.5 rounded-full border border-border/60 shadow-sm ring-offset-1 hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {getProductColors(product).length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{getProductColors(product).length - 4}
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <Link
          href={`/product/${product.slug}`}
          className="block font-semibold text-sm text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>

        {/* Style tag */}
        <p className="text-xs text-muted-foreground">
          {styleLabelMap[product.style] ?? product.style}
          {product.category === 'WOMEN' ? ' · Ladies' : product.category === 'MEN' ? ' · Gents' : ' · Kids'}
        </p>

        {/* Rating */}
        {product.averageRating && product.reviewCount && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < Math.floor(product.averageRating!)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-muted text-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-base text-foreground">
            {formatPrice(effectivePrice)}
          </span>
          {product.salePrice && product.salePrice < product.basePrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for product cards (used during loading states)
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="flex gap-1.5">
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
        </div>
        <div className="h-4 w-4/5 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-5 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}
