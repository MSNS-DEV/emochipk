'use client';

import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/utils/catalog';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Package, ArrowLeft, Truck, MapPin, CreditCard, CheckCircle2, Clock, RefreshCw, MessageSquare, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

const STATUS_STEP: Record<string, number> = {
  PENDING: 0, PENDING_VERIFICATION: 1, VERIFIED: 1, PROCESSING: 2,
  PACKED: 3, SHIPPED: 4, OUT_FOR_DELIVERY: 4, DELIVERED: 5,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', PENDING_VERIFICATION: 'bg-orange-100 text-orange-800',
  VERIFIED: 'bg-blue-100 text-blue-800', PROCESSING: 'bg-purple-100 text-purple-800',
  PACKED: 'bg-indigo-100 text-indigo-800', SHIPPED: 'bg-cyan-100 text-cyan-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800', DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800', RETURNED: 'bg-gray-100 text-gray-800',
};

const trackingSteps = [
  { label: 'Order Placed', icon: Package }, { label: 'Confirmed', icon: CreditCard },
  { label: 'Processing', icon: Clock }, { label: 'Packed', icon: MapPin },
  { label: 'Shipped', icon: Truck }, { label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const orderId = params.orderId as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const { data: order, isLoading } = api.order.getById.useQuery(orderId, { enabled: !!orderId && isAuthenticated });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container py-8">
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-medium mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-6">This order doesn&apos;t exist or you don&apos;t have access.</p>
            <Button asChild><Link href="/account/orders">Back to Orders</Link></Button>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_STEP[order.status] ?? 0;
  const statusColor = STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <div className="mb-8">
          <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold">Order {order.orderNumber}</h1>
              <p className="text-muted-foreground mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Badge className={statusColor}>{order.status.replace(/_/g, ' ')}</Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Order Tracking</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="flex justify-between">
                    {trackingSteps.map((step, i) => {
                      const isCompleted = i <= currentStep;
                      const isCurrent = i === currentStep;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.label} className="flex flex-col items-center relative z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                          </div>
                          <span className={`text-xs mt-2 text-center max-w-[60px] ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted -z-0">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.max(0, (currentStep / (trackingSteps.length - 1)) * 100)}%` }} />
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tracking Number</p>
                      <p className="font-mono font-medium">{order.trackingNumber}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(order.trackingNumber!); toast.success('Copied'); }}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Order Items</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: Record<string, unknown>) => (
                    <div key={item.id as string} className="flex gap-4">
                      <div className="h-20 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {(item.variant as any)?.product?.images?.[0]?.url ? (
                          <Image src={(item.variant as any).product.images[0].url} alt="" width={80} height={80} className="object-cover h-full w-full" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/50" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{(item.variant as Record<string, Record<string, string>>)?.product?.name ?? 'Product'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Size: UK {(item.variant as Record<string, string>)?.sizeUK} | Color: {(item.variant as Record<string, string>)?.color}
                        </p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity as number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(Number(item.totalPrice))}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(Number(item.unitPrice))} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Shipping Address</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.shippingAddress?.fullName ?? order.user?.name}</p>
                    <p className="text-muted-foreground">{order.shippingAddress?.street}</p>
                    <p className="text-muted-foreground">{order.shippingAddress?.city}, {order.shippingAddress?.province}</p>
                    <p className="text-muted-foreground">{order.shippingAddress?.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(Number((order as any).subtotalAmount ?? order.totalAmount))}</span></div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatPrice(Number(order.discountAmount))}</span></div>
                )}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{Number(order.shippingCost) === 0 ? 'Free' : formatPrice(Number(order.shippingCost))}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(Number(order.totalAmount))}</span></div>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Need Help?</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {order.status === 'DELIVERED' && (
                  <>
                    <Button variant="outline" className="w-full justify-start"><RefreshCw className="h-4 w-4 mr-2" /> Request Exchange</Button>
                    <Button variant="outline" className="w-full justify-start"><Download className="h-4 w-4 mr-2" /> Download Invoice</Button>
                  </>
                )}
                <Button variant="outline" className="w-full justify-start"><MessageSquare className="h-4 w-4 mr-2" /> Contact Support</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
