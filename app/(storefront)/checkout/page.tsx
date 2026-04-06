'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, CreditCard, Truck, Building2, Smartphone, Banknote, Lock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { PaymentMethod } from '@/lib/types';

const pakistanProvinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Kashmir',
  'Gilgit-Baltistan',
];

const paymentMethods: { id: PaymentMethod; name: string; icon: typeof CreditCard; description: string }[] = [
  { id: 'COD', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive your order' },
  { id: 'JAZZCASH', name: 'JazzCash', icon: Smartphone, description: 'Pay with JazzCash mobile wallet' },
  { id: 'EASYPAISA', name: 'EasyPaisa', icon: Smartphone, description: 'Pay with EasyPaisa mobile wallet' },
  { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: Building2, description: 'Direct bank transfer' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, itemCount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [sameAsBilling, setSameAsBilling] = useState(true);

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
    saveInfo: false,
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.email || !formData.phone || !formData.firstName || !formData.lastName ||
        !formData.address || !formData.city || !formData.province) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Simulate order submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate order number
    const orderNumber = `EM-${Date.now().toString(36).toUpperCase()}`;

    // Clear cart and redirect to success
    clearCart();
    
    toast.success('Order placed successfully!', {
      description: `Order #${orderNumber}`,
    });

    router.push(`/order-success?order=${orderNumber}`);
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
                
                {!isAuthenticated && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Already have an account?{' '}
                    <Link href="/login?redirect=/checkout" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}

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
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
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
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="grid gap-3"
                >
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        paymentMethod === method.id
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

                {paymentMethod === 'COD' && (
                  <p className="mt-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm dark:bg-amber-900/20 dark:text-amber-200">
                    A COD verification call will be made before dispatch. PKR 50 COD fee applies.
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : `Place Order - ${formatPrice(cart.total)}`}
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
                      {item.variant?.product?.images[0] ? (
                        <Image
                          src={item.variant.product.images[0].url}
                          alt={item.variant.product.name}
                          fill
                          className="object-cover"
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
                        {item.variant?.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant?.color} / Size {item.variant?.size}
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
                    <span>Discount ({cart.couponCode})</span>
                    <span>-{formatPrice(cart.discountAmount)}</span>
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
                <span>{formatPrice(cart.total + (paymentMethod === 'COD' ? 50 : 0))}</span>
              </div>

              {/* Submit Button (Desktop) */}
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
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
