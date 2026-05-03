'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag, X, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/data';

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartPage() {
  const { cart, itemCount, updateQuantity, removeFromCart, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const result = await applyCoupon(couponCode);
    if (!result.success) {
      setCouponError(result.error || 'Invalid coupon');
    } else {
      setCouponCode('');
    }
    setCouponLoading(false);
  };

  const progressToFreeShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD
    ? 100
    : (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100;

  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - cart.subtotal;

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-semibold mb-3">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you have not added anything to your cart yet. 
            Explore our collection and find something you love.
          </p>
          <Button asChild size="lg">
            <Link href="/shop">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Free Shipping Progress */}
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            {cart.subtotal >= FREE_SHIPPING_THRESHOLD ? (
              <span className="text-xs sm:text-sm font-medium text-green-600">
                You have qualified for free shipping!
              </span>
            ) : (
              <span className="text-xs sm:text-sm">
                Add <strong>{formatPrice(amountToFreeShipping)}</strong> more for free shipping
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressToFreeShipping}%` }}
            />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-12 space-y-8 lg:space-y-0">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-3 sm:space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-card border border-border"
                >
                  {/* Image */}
                  <Link
                    href={`/product/${item.variant?.product?.slug}`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden bg-secondary/30 shrink-0"
                  >
                    {item.variant?.product?.images[0] ? (
                      <Image
                        src={item.variant.product.images[0].url}
                        alt={item.variant.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between gap-2 items-start">
                        <Link
                          href={`/product/${item.variant?.product?.slug}`}
                          className="font-serif text-sm sm:text-base lg:text-lg font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.variant?.product?.name || 'Product'}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 h-fit text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {item.variant?.color} / Size {item.variant?.size}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.variant?.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
                      {/* Quantity */}
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-secondary transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm sm:text-base">{formatPrice(item.totalPrice)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.unitPrice)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/shop">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:mt-0">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="font-serif text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-4 sm:mb-6">
                {cart.couponCode ? (
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium truncate">{cart.couponCode}</span>
                    </div>
                    <button onClick={removeCoupon} className="hover:text-green-900 dark:hover:text-green-200 flex-shrink-0 ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="text-xs sm:text-sm h-9"
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-destructive text-xs mt-1">{couponError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Try: WELCOME10, MOCHI20, or EID500
                    </p>
                  </div>
                )}
              </div>

              <Separator className="mb-4 sm:mb-6" />

              {/* Totals */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(cart.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {cart.shippingAmount === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(cart.shippingAmount)
                    )}
                  </span>
                </div>
              </div>

              <Separator className="my-4 sm:my-6" />

              <div className="flex justify-between text-base sm:text-lg font-semibold mb-4 sm:mb-6">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>

              <Button asChild className="w-full h-11 text-sm sm:text-base font-medium">
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3 sm:mt-4">
                Taxes calculated at checkout. Prices in PKR.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
