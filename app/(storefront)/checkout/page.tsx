'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, CreditCard, Truck, Building2, Smartphone, Banknote, Lock, ShoppingBag, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/data';
import { api } from '@/lib/trpc';
import { useMetaPixel } from '@/hooks/use-meta-pixel';

/** Read a cookie value by name (client-side only) */
function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2] ?? '';
}

const pakistanProvinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Kashmir',
  'Gilgit-Baltistan',
];

type PaymentMethodId = 'COD' | 'JAZZCASH' | 'EASYPAISA' | 'RAAST' | 'CARD';

const paymentMethods: { id: PaymentMethodId; name: string; icon: typeof CreditCard; description: string }[] = [
  { id: 'COD', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive your order' },
  { id: 'JAZZCASH', name: 'JazzCash', icon: Smartphone, description: 'Pay with JazzCash mobile wallet' },
  { id: 'EASYPAISA', name: 'EasyPaisa', icon: Smartphone, description: 'Pay with EasyPaisa mobile wallet' },
  { id: 'RAAST', name: 'Raast / Bank Transfer', icon: Building2, description: 'Instant bank-to-bank transfer' },
  { id: 'CARD', name: 'Credit / Debit Card', icon: CreditCard, description: 'Visa, Mastercard via Safepay' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { trackInitiateCheckout } = useMetaPixel();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('COD');

  // Fire InitiateCheckout when checkout page loads
  useEffect(() => {
    if (cart.items.length > 0) {
      const total = cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      trackInitiateCheckout({
        value: total,
        numItems: cart.items.reduce((s, i) => s + i.quantity, 0),
        contentIds: cart.items.map((i) => i.variantId),
        userData: {
          email: user?.email ?? undefined,
          phone: (user as any)?.phone ?? undefined,
          firstName: user?.name?.split(' ')[0] ?? undefined,
          lastName: user?.name?.split(' ').slice(1).join(' ') ?? undefined,
          userId: user?.id ?? undefined,
        },
      });
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    address: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
  });

  const [cardPrefix, setCardPrefix] = useState<string>('');

  const cleanBin = cardPrefix.replace(/\D/g, '').slice(0, 6);

  // Real-time BIN lookup query for Pakistani bank alliance discounts
  const { data: binData, isFetching: isCheckingBin } = api.payment.lookupBin.useQuery(
    { bin: cleanBin, subtotal: cart.subtotal },
    { enabled: paymentMethod === 'CARD' && cleanBin.length >= 6 }
  );

  const appliedBankDiscount =
    paymentMethod === 'CARD' && binData?.isEligible ? binData.discountAmount : 0;

  // Mutation to create Safepay 3DS checkout session
  const initiateCardPayment = api.payment.initiateCardSession.useMutation({
    onSuccess: ({ redirectUrl }) => {
      clearCart();
      toast.success('Order created! Redirecting to secure card payment...');
      window.location.href = redirectUrl;
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to initiate secure card payment.');
      setIsSubmitting(false);
    },
  });

  // Fetch active branches for order placement
  const { data: branches } = api.branch.getAll.useQuery();

  const createOrder = api.order.create.useMutation({
    onSuccess: (order) => {
      if (paymentMethod === 'CARD') {
        initiateCardPayment.mutate({
          orderNumber: order.orderNumber,
          cardBin: cleanBin || undefined,
        });
      } else {
        clearCart();
        toast.success('Order placed!', { description: `Order #${order.orderNumber}` });
        router.push(`/order-success?order=${order.orderNumber}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.email || !formData.phone || !formData.firstName ||
      !formData.address || !formData.city || !formData.province) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      setIsSubmitting(false);
      return;
    }

    // Pick first available branch (Pasrur by default)
    const branch = branches?.[0];
    if (!branch) {
      toast.error('No branch available. Please try again later.');
      setIsSubmitting(false);
      return;
    }

    // Build order items — each cart item must have a real DB variantId
    const items = cart.items
      .filter(i => i.variantId && !i.variantId.startsWith('item-'))
      .map(i => ({ variantId: i.variantId, quantity: i.quantity }));

    if (items.length === 0) {
      // Fallback: can't submit without valid variant IDs (guest cart may have stale items)
      toast.error('Unable to process order items. Please re-add products to your cart.');
      setIsSubmitting(false);
      return;
    }

    createOrder.mutate({
      branchId: branch.id,
      paymentMethod,
      shippingAddress: {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        street: `${formData.address}${formData.apartment ? ', ' + formData.apartment : ''}`,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode || undefined,
        country: 'Pakistan',
      },
      notes: formData.notes || undefined,
      couponCode: cart.couponCode || undefined,
      discountAmount: (cart.discountAmount || 0) + appliedBankDiscount,
      shippingCost: cart.shippingAmount,
      items,
      // Meta CAPI enrichment
      fbp: getCookie('_fbp') || undefined,
      fbc: getCookie('_fbc') || undefined,
      clientUserAgent: navigator.userAgent,
      eventSourceUrl: window.location.href,
    });
  };

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-semibold mb-3">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your cart before checking out.
          </p>
          <Button asChild size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Checkout Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-semibold mb-6">Contact Information</h2>

                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-semibold mb-6">Shipping Address</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="House/Building number and street name"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apartment">Apartment, Suite, etc. (optional)</Label>
                    <Input
                      id="apartment"
                      name="apartment"
                      placeholder="Apartment, suite, unit, etc."
                      value={formData.apartment}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {pakistanProvinces.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code (optional)</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-semibold mb-6">Payment Method</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
                  className="grid gap-3"
                >
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${paymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <RadioGroupItem value={method.id} className="mt-1" />
                      <method.icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {paymentMethod === 'CARD' && (
                  <div className="mt-4 space-y-4 p-4 rounded-lg bg-secondary/30 border border-border">
                    {/* Bank Alliances Privilege Callout */}
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <div className="font-semibold flex items-center gap-1.5 mb-1 text-sm">
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Exclusive Bank Card Discounts Available:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <div>• <strong>HBL:</strong> 15% OFF (up to Rs. 2,500)</div>
                        <div>• <strong>Bank Alfalah:</strong> 10% OFF (up to Rs. 2,000)</div>
                        <div>• <strong>Meezan Bank:</strong> 10% OFF (up to Rs. 1,500)</div>
                        <div>• <strong>Standard Chartered:</strong> 15% OFF (up to Rs. 3,000)</div>
                      </div>
                    </div>

                    {/* Card BIN Input */}
                    <div className="space-y-2">
                      <Label htmlFor="cardPrefix" className="text-sm font-medium">
                        Card Number (First 6 Digits for Instant Discount)
                      </Label>
                      <div className="relative">
                        <Input
                          id="cardPrefix"
                          name="cardPrefix"
                          type="text"
                          maxLength={19}
                          placeholder="e.g. 4214 44•• •••• ••••"
                          value={cardPrefix}
                          onChange={(e) => setCardPrefix(e.target.value)}
                          className="font-mono pr-10"
                        />
                        {isCheckingBin && (
                          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter your card prefix to verify bank alliance discount. You will be redirected to Safepay 3D Secure to complete payment.
                      </p>
                    </div>

                    {/* BIN Discount Feedback Badge */}
                    {binData?.isEligible && (
                      <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-xs dark:bg-green-950/40 dark:border-green-800 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <div>
                          <span className="font-semibold">{binData.bankName}:</span> {binData.message}
                        </div>
                      </div>
                    )}

                    {binData && !binData.isEligible && binData.message && (
                      <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                        {binData.message}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <p className="mt-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm dark:bg-amber-900/20 dark:text-amber-200">
                    A verification call will be made before dispatch to confirm your order. PKR 50 COD fee applies.
                  </p>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-serif text-xl font-semibold mb-4">Order Notes (optional)</h2>
                <textarea
                  name="notes"
                  placeholder="Special instructions for your order..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-input rounded-lg bg-background text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Submit Button (Mobile) */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base"
                  disabled={isSubmitting || createOrder.isPending || initiateCardPayment.isPending}
                >
                  {(isSubmitting || createOrder.isPending || initiateCardPayment.isPending) ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
                  ) : paymentMethod === 'CARD' ? (
                    `Proceed to Card Payment — ${formatPrice(Math.max(0, cart.total - appliedBankDiscount))}`
                  ) : (
                    `Place Order — ${formatPrice(cart.total + (paymentMethod === 'COD' ? 50 : 0))}`
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  Secure checkout
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-24 bg-card rounded-lg border border-border p-6">
              <h2 className="font-serif text-xl font-semibold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary/30 shrink-0">
                      {(item.variant as any)?.product?.images?.[0] ? (
                        <Image
                          src={(item.variant as any).product.images[0].url}
                          alt={(item.variant as any).product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (item.variant as any)?.image ? (
                        <Image
                          src={(item.variant as any).image}
                          alt={(item.variant as any).name ?? 'Product'}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {(item.variant as any)?.product?.name ?? (item.variant as any)?.name ?? 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(item.variant as any)?.color && `${(item.variant as any).color} / `}
                        {(item.variant as any)?.size ? `Size ${(item.variant as any).size}` : (item.variant as any)?.sizeUK ? `Size ${(item.variant as any).sizeUK}` : ''}
                      </p>
                    </div>
                    <p className="font-medium text-sm">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>

              <Separator className="mb-6" />

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
                    <span>-{formatPrice(cart.discountAmount)}</span>
                  </div>
                )}
                {appliedBankDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Bank Discount ({binData?.bankName})</span>
                    <span>-{formatPrice(appliedBankDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {cart.shippingAmount === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(cart.shippingAmount)
                    )}
                  </span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">COD Fee</span>
                    <span>{formatPrice(50)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between text-lg font-semibold mb-6">
                <span>Total</span>
                <span>{formatPrice(Math.max(0, cart.total + (paymentMethod === 'COD' ? 50 : 0) - appliedBankDiscount))}</span>
              </div>

              {/* Submit Button (Desktop) */}
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base"
                  disabled={isSubmitting || createOrder.isPending || initiateCardPayment.isPending}
                  onClick={handleSubmit}
                >
                  {(isSubmitting || createOrder.isPending || initiateCardPayment.isPending) ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
                  ) : paymentMethod === 'CARD' ? (
                    `Proceed to Card Payment — ${formatPrice(Math.max(0, cart.total - appliedBankDiscount))}`
                  ) : (
                    `Place Order — ${formatPrice(cart.total + (paymentMethod === 'COD' ? 50 : 0))}`
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  Secure checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
