'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/data';
import {
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
  getProductColors,
  getStyleLabel,
} from '@/lib/data';

interface ProductCardProps {
  product: CatalogProduct;
  className?: string;
  /** When set, show this color swatch as the "active" color on the card */
  displayColor?: string;
}

export function ProductCard({ product, className, displayColor }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  // Match image for displayColor if specified, else primary image, else first image
  const primaryImage =
    (displayColor
      ? product.images.find(
          (img) =>
            img.colorTag &&
            img.colorTag.trim().toLowerCase() === displayColor.trim().toLowerCase()
        )
      : null) ??
    product.images.find((img) => img.isPrimary) ??
    product.images[0];

  const discountPct = getDiscountPercent(product);
  const effectivePrice = getEffectivePrice(product);
  const colors = getProductColors(product).slice(0, 4);

  // Active color name for highlighting swatch
  const activeColorName =
    displayColor ||
    primaryImage?.colorTag ||
    (colors.length > 0 ? colors[0].name : undefined);

  const productHref = displayColor
    ? `/product/${product.slug}?color=${encodeURIComponent(displayColor)}`
    : `/product/${product.slug}`;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => {
      const next = !prev;
      if (next) {
        toast.success(`Saved "${product.name}" to your wishlist`);
      } else {
        toast.info(`Removed "${product.name}" from your wishlist`);
      }
      return next;
    });
  };

  const craftsmanshipLabel =
    product.manufacturingCity === 'Imported'
      ? 'Curated Luxury Collection'
      : 'Handcrafted in Pasrur & Ghakhar';

  return (
    <div className={cn('group relative flex flex-col', className)}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900 border border-border/40">
        <Link href={productHref} className="block w-full h-full">
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
                {product.style === 'SANDALS'
                  ? '🩴'
                  : product.style === 'PESHAWARI'
                  ? '🥿'
                  : product.style === 'SNEAKERS'
                  ? '👟'
                  : product.style === 'ACCESSORIES'
                  ? '🧦'
                  : '👞'}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{product.articleNumber}</span>
            </div>
          )}
        </Link>

        {/* Badges (Top Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPct ? (
            <Badge className="bg-red-600 text-white font-semibold text-xs px-2 py-0.5 shadow-sm">
              -{discountPct}%
            </Badge>
          ) : null}
          {product.isFeatured && !discountPct && (
            <Badge className="bg-amber-400 text-stone-950 font-semibold text-xs px-2 py-0.5 shadow-sm">
              Featured
            </Badge>
          )}
        </div>

        {/* Article No Badge (Bottom Left) */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="text-[10px] font-mono bg-black/60 text-white/90 rounded px-1.5 py-0.5 backdrop-blur-sm border border-white/10">
            {product.articleNumber}
          </span>
        </div>

        {/* Wishlist Button (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={toggleWishlist}
            className={cn(
              'h-8 w-8 rounded-full shadow-md bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm hover:bg-white transition-all duration-200',
              'opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-1 sm:group-hover:translate-x-0',
              isWishlisted && 'opacity-100 sm:opacity-100 text-red-500 hover:text-red-600'
            )}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-700 dark:text-stone-300'
              )}
            />
          </Button>
        </div>

        {/* Quick View Button (Bottom Drawer) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button
            asChild
            size="sm"
            className="w-full bg-stone-950/95 hover:bg-stone-950 text-white backdrop-blur-sm text-xs font-medium shadow-md"
          >
            <Link href={productHref}>
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              View &amp; Select Size
            </Link>
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-3 flex-1 flex flex-col justify-between space-y-1.5">
        <div className="space-y-1.5">
          {/* Interactive Color Swatches */}
          {colors.length > 1 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {colors.map((color) => {
                const isActive =
                  activeColorName &&
                  color.name.toLowerCase() === activeColorName.toLowerCase();

                return (
                  <Link
                    key={color.name}
                    href={`/product/${product.slug}?color=${encodeURIComponent(color.name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'h-3.5 w-3.5 rounded-full border shadow-xs ring-offset-1 transition-all cursor-pointer block',
                      isActive
                        ? 'ring-2 ring-amber-500 scale-110 border-transparent'
                        : 'border-border/70 hover:ring-2 hover:ring-amber-400/80 hover:scale-105'
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={`View ${color.name}`}
                  />
                );
              })}
              {getProductColors(product).length > 4 && (
                <span className="text-[10px] text-muted-foreground ml-0.5 font-medium">
                  +{getProductColors(product).length - 4}
                </span>
              )}
            </div>
          )}

          {/* Product Name */}
          <Link
            href={productHref}
            className="block font-semibold text-sm text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* Craftsmanship Highlight Badge */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
            <span>{craftsmanshipLabel}</span>
          </div>

          {/* Style & Gender Tag */}
          <p className="text-xs text-muted-foreground">
            {getStyleLabel(product.style)}
            {product.category === 'WOMEN'
              ? ' · Ladies'
              : product.category === 'MEN'
              ? ' · Gents'
              : product.category === 'KIDS'
              ? ' · Kids'
              : ' · Accessories'}
          </p>

          {/* Star Rating */}
          {product.averageRating && product.reviewCount ? (
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
          ) : null}
        </div>

        {/* Price Tag */}
        <div className="flex items-baseline gap-2 pt-1.5">
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
    <div className="animate-pulse flex flex-col">
      <div className="aspect-[3/4] rounded-xl bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="flex gap-1.5">
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
          <div className="h-3.5 w-3.5 rounded-full bg-muted" />
        </div>
        <div className="h-4 w-4/5 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-5 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}
