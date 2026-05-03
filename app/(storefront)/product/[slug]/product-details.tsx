'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heart, Share2, Truck, Shield, RefreshCw, Minus, Plus, Star, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCart } from '@/lib/cart-context';
import { cn } from '@/lib/utils';
import type { CatalogProduct, CatalogVariant } from '@/lib/data';
import {
  formatPrice,
  getProductColors,
  getProductSizes,
  getVariantsByColor,
  getVariant,
  isVariantInStock,
  getEffectivePrice,
  getDiscountPercent,
} from '@/lib/data';

interface ProductDetailsProps {
  product: CatalogProduct;
}

const leatherTypeLabel: Record<string, string> = {
  CALF_SKIN:         'Calf Skin Leather',
  GOAT_LEATHER:      'Goat Leather',
  SUEDE:             'Suede Leather',
  NUBUCK:            'Nubuck Leather',
  PREMIUM_SYNTHETIC: 'Premium Synthetic',
};

const styleLabel: Record<string, string> = {
  SANDALS:   'Chappal / Sandals',
  PESHAWARI: 'Peshawari',
  SNEAKERS:  'Jogger / Sneakers',
  OXFORD:    'Formal Shoe (Oxford)',
  LOAFERS:   'Loafer',
  MOCCASINS: 'Moccasin',
};

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const colors = getProductColors(product);
    return colors[0]?.name ?? '';
  });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const colors      = useMemo(() => getProductColors(product), [product]);
  const allSizes    = useMemo(() => getProductSizes(product), [product]);

  // Get color-specific images, fall back to general images
  const displayImages = useMemo(() => {
    const colorSpecificImages = product.images.filter((img) => img.colorTag === selectedColor);
    return colorSpecificImages.length > 0 ? colorSpecificImages : product.images;
  }, [product, selectedColor]);

  // Reset selected image index if out of bounds
  const validSelectedImage = selectedImage < displayImages.length ? selectedImage : 0;

  // Sizes available for selected color
  const sizesForColor = useMemo(
    () => getVariantsByColor(product, selectedColor).map((v) => v.sizeUK),
    [product, selectedColor]
  );

  const selectedVariant = useMemo(
    () => (selectedColor && selectedSize ? getVariant(product, selectedColor, selectedSize) ?? null : null),
    [product, selectedColor, selectedSize]
  );

  const inStock = selectedVariant ? isVariantInStock(selectedVariant) : false;

  const discountPct    = getDiscountPercent(product);
  const effectivePrice = getEffectivePrice(product);

  // Stock across all branches for selected variant
  const totalStock = selectedVariant
    ? (selectedVariant.inventory ?? []).reduce((s: number, i: { quantity: number; reserved: number }) => s + i.quantity - i.reserved, 0)
    : 0;

  // Stock per branch display
  const branchStock = selectedVariant
    ? (selectedVariant.inventory ?? []).map((inv: { branchId: string; quantity: number; reserved: number }) => ({
        branchId: inv.branchId,
        branchName: inv.branchId.includes('pasrur') ? 'Pasrur Store' : 'Daska Store',
        qty: inv.quantity - inv.reserved,
      }))
    : [];

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a size');
      return;
    }
    if (!inStock) {
      toast.error('This size is currently out of stock');
      return;
    }
    addToCart(
      selectedVariant.id,
      {
        name: product.name,
        price: effectivePrice,
        image: product.images[0]?.url,
      },
      quantity
    );
    toast.success(`Added to cart`, {
      description: `${product.name} · ${selectedColor} · UK ${selectedSize} × ${quantity}`,
      action: { label: 'View Cart', onClick: () => (window.location.href = '/cart') },
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16">

        {/* ─── IMAGE GALLERY ─── */}
        <div className="space-y-3 sm:space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900">
            {displayImages[validSelectedImage] ? (
              <Image
                src={displayImages[validSelectedImage].url}
                alt={displayImages[validSelectedImage].altText ?? product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                <span className="text-8xl">
                  {product.style === 'SANDALS'   ? '🩴' :
                   product.style === 'PESHAWARI' ? '🥿' :
                   product.style === 'SNEAKERS'  ? '👟' : '👞'}
                </span>
                <span className="font-mono text-sm text-muted-foreground">{product.articleNumber}</span>
                <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                  Product photo coming soon — upload via Admin Portal
                </p>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discountPct && (
                <Badge className="bg-red-500 text-white font-bold text-sm px-2.5 py-1">
                  -{discountPct}% OFF
                </Badge>
              )}
              {product.isFeatured && !discountPct && (
                <Badge className="bg-amber-500 text-stone-950 font-bold text-sm px-2.5 py-1">
                  Featured
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnails - Show color-specific images when available */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {displayImages.map((image, index) => (
                <button
                  key={`${selectedColor}-${index}`}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all',
                    validSelectedImage === index
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : 'border-transparent hover:border-border'
                  )}
                  title={`View image ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.altText ?? `${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── PRODUCT INFO ─── */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-4 sm:space-y-6">

          {/* Article Number */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
              {product.articleNumber}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{styleLabel[product.style] ?? product.style}</span>
          </div>

          {/* Title */}
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            {product.averageRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.floor(product.averageRating!)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-muted text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.averageRating} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(effectivePrice)}
              </span>
              {product.salePrice && product.salePrice < product.basePrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium">
                    Save {formatPrice(product.basePrice - product.salePrice)}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Color:{' '}
                <span className="font-normal text-muted-foreground">{selectedColor || 'Select'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color.name);
                    // Reset size if not available in new color
                    if (selectedSize && !getVariant(product, color.name, selectedSize)) {
                      setSelectedSize(null);
                    }
                  }}
                  className={cn(
                    'w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all hover:scale-110 flex-shrink-0',
                    selectedColor === color.name
                      ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2'
                      : 'border-border'
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selection (UK) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                UK Size:{' '}
                <span className="font-normal text-muted-foreground">{selectedSize ?? 'Select'}</span>
              </span>
              <Link href="/size-guide" className="text-xs text-amber-600 hover:underline">
                Size Guide →
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {allSizes.sort((a, b) => Number(a) - Number(b)).map((size) => {
                const available = sizesForColor.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => available && setSelectedSize(size)}
                    disabled={!available}
                    className={cn(
                      'h-11 sm:h-12 rounded-lg border-2 text-sm font-semibold transition-all',
                      selectedSize === size
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : available
                        ? 'border-border hover:border-amber-400'
                        : 'border-border/40 text-muted-foreground/40 cursor-not-allowed line-through'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Branch stock display */}
            {selectedVariant && inStock && (
              <div className="mt-3 flex flex-wrap gap-2">
                {branchStock.map((bs) => (
                  <span
                    key={bs.branchId}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border font-medium',
                      bs.qty > 0
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                        : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                    )}
                  >
                    {bs.branchName}: {bs.qty > 0 ? `${bs.qty} in stock` : 'Out of stock'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 px-3 hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                  title="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="h-11 px-3 hover:bg-muted transition-colors"
                  title="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <Button
                size="lg"
                className="flex-1 h-11 bg-stone-950 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-stone-950 font-semibold text-base"
                onClick={handleAddToCart}
                disabled={!selectedVariant || !inStock}
              >
                {!selectedSize
                  ? 'Select a Size'
                  : !inStock
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </Button>

              {/* Wishlist */}
              <Button size="lg" variant="outline" className="h-11 w-11 p-0 flex-shrink-0">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Add to Wishlist</span>
              </Button>
            </div>
          </div>

          {/* In-stock status */}
          {selectedVariant && (
            <div className="flex items-center gap-2 text-sm">
              {inStock ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    In Stock – Ready to Ship
                  </span>
                </>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>
          )}

          {/* COD notice */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
            <Package className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Cash on Delivery Available
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Pay when your order arrives. We&apos;ll verify your order via WhatsApp.
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 py-4 border-y border-border">
            {[
              { icon: Truck,     label: 'Free Shipping', sub: 'Orders above PKR 5,000' },
              { icon: RefreshCw, label: '7-Day Exchange', sub: 'Hassle-free policy' },
              { icon: Shield,    label: 'Secure Checkout', sub: 'COD · JazzCash · Raast' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center text-center gap-1">
                <f.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{f.label}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-2">{f.sub}</span>
              </div>
            ))}
          </div>

          {/* Details Accordion */}
          <Accordion type="single" collapsible defaultValue="description">
            <AccordionItem value="description">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details">
              <AccordionTrigger>Product Details</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Article No:</strong> {product.articleNumber}</li>
                  <li><strong className="text-foreground">Style:</strong> {styleLabel[product.style] ?? product.style}</li>
                  {product.leatherType && <li><strong className="text-foreground">Material:</strong> {leatherTypeLabel[product.leatherType] ?? product.leatherType}</li>}
                  {product.manufacturingCity && <li><strong className="text-foreground">Made In:</strong> {product.manufacturingCity}</li>}
                  <li><strong className="text-foreground">Available Sizes (UK):</strong> {allSizes.sort((a,b) => Number(a)-Number(b)).join(', ')}</li>
                  <li><strong className="text-foreground">Available Colors:</strong> {colors.map((c) => c.name).join(', ')}</li>
                  <li><strong className="text-foreground">Width:</strong> Standard</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping & Returns</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-medium text-foreground mb-1.5">Delivery</h4>
                    <p>Free shipping on orders above PKR 5,000. Standard delivery 3–5 business days for major cities. Rural areas may take 5–7 days.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1.5">Exchange Policy</h4>
                    <p>7-day exchange window from delivery date. Items must be unworn, with original tags. Size exchange subject to availability.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1.5">Courier Partners</h4>
                    <p>We ship via Leopards, PostEx, Trax, and Pakistan Post depending on your location.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Share */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Share:</span>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
