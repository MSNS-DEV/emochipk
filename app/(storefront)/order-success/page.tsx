import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const { order: orderNumber } = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl font-semibold mb-3">
            Thank You for Your Order!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your order has been placed successfully. We have sent a confirmation 
            to your email address.
          </p>

          {/* Order Number */}
          {orderNumber && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-8">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-mono text-xl font-semibold">{orderNumber}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive an SMS and email with your order details.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will prepare your order for shipment within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Shipping</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive tracking information once your order ships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button asChild size="lg">
              <Link href="/shop">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/account/orders">
                <Package className="mr-2 h-4 w-4" />
                View Orders
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Need help with your order?</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="tel:+923001234567" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                +92 300 1234567
              </a>
              <a href="mailto:support@executivemochi.pk" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                support@executivemochi.pk
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
