'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Search, Clock, Package, Truck, CheckCircle2, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, MapPin, Phone, Mail, CreditCard, User,
  RotateCcw, AlertTriangle, Eye, TrendingUp, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof Package }> = {
  PENDING:                      { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',  label: 'Pending',               icon: Clock },
  PENDING_VERIFICATION:         { color: 'bg-orange-500/15 text-orange-400 border-orange-500/20',  label: 'Pending Verification',  icon: AlertTriangle },
  VERIFIED:                     { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',         label: 'Verified',              icon: CheckCircle2 },
  PROCESSING:                   { color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',   label: 'Processing',            icon: Package },
  PACKED:                       { color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',         label: 'Packed',                icon: Package },
  SHIPPED:                      { color: 'bg-purple-500/15 text-purple-400 border-purple-500/20',   label: 'Shipped',               icon: Truck },
  OUT_FOR_DELIVERY:             { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',      label: 'Out for Delivery',      icon: Truck },
  DELIVERED:                    { color: 'bg-green-500/15 text-green-400 border-green-500/20',      label: 'Delivered',             icon: CheckCircle2 },
  CANCELLED:                    { color: 'bg-red-500/15 text-red-400 border-red-500/20',            label: 'Cancelled',             icon: XCircle },
  CANCELLED_VERIFICATION_FAILED:{ color: 'bg-red-600/15 text-red-500 border-red-600/20',            label: 'Verification Failed',   icon: XCircle },
  RTO:                          { color: 'bg-rose-500/15 text-rose-400 border-rose-500/20',         label: 'Return to Origin',      icon: RotateCcw },
  RETURNED:                     { color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',         label: 'Returned',              icon: RotateCcw },
};

const STATUSES = Object.keys(STATUS_CONFIG);

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  RAAST: 'Raast',
  JAZZCASH: 'JazzCash',
  EASYPAISA: 'EasyPaisa',
  CARD: 'Card',
  STORE_CREDIT: 'Store Credit',
  LOYALTY_POINTS: 'Loyalty Points',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-white leading-tight">{value}</div>
        <div className="text-[11px] text-zinc-500">{label}</div>
        {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: 'bg-zinc-500/15 text-zinc-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDetailDrawer({
  orderId,
  open,
  onClose,
  onStatusUpdated,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}) {
  const utils = api.useUtils();
  const { data: order, isLoading } = api.order.getById.useQuery(orderId ?? '', {
    enabled: !!orderId,
  });

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Order status updated');
      void utils.order.getById.invalidate(orderId ?? '');
      onStatusUpdated();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] bg-zinc-950 border-white/10 p-0 overflow-y-auto"
      >
        <SheetHeader className="px-6 py-4 border-b border-white/5 bg-zinc-900/50">
          <SheetTitle className="text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" />
            {isLoading ? 'Loading…' : `Order #${order?.orderNumber}`}
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 text-amber-500 animate-spin" />
          </div>
        )}

        {order && !isLoading && (
          <div className="p-6 space-y-6">
            {/* Status row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <StatusBadge status={order.status} />
                <p className="text-xs text-zinc-500 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {new Date(order.createdAt).toLocaleString('en-PK')}
                </p>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Update Status</label>
                <Select
                  value={order.status}
                  onValueChange={(v) => updateStatus.mutate({ orderId: order.id, status: v as never })}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="w-full sm:w-52 h-8 bg-zinc-800 border-white/10 text-zinc-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-white text-xs">
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <User className="h-3 w-3 inline mr-1.5" />Customer
              </h3>
              <p className="text-sm text-white font-medium">{order.user?.name ?? 'Guest'}</p>
              {order.user?.email && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />{order.user.email}
                </p>
              )}
              {order.user?.phone && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />{order.user.phone}
                </p>
              )}
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <MapPin className="h-3 w-3 inline mr-1.5" />Shipping Address
                </h3>
                <p className="text-sm text-white">{order.shippingAddress.fullName}</p>
                <p className="text-xs text-zinc-400 mt-1">{order.shippingAddress.street}</p>
                <p className="text-xs text-zinc-400">
                  {order.shippingAddress.city}, {order.shippingAddress.province}
                  {order.shippingAddress.postalCode && ` — ${order.shippingAddress.postalCode}`}
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                  <Phone className="h-3 w-3" />{order.shippingAddress.phone}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <CreditCard className="h-3 w-3 inline mr-1.5" />Payment
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Method</span>
                <span className="text-xs text-white font-medium">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-zinc-400">Status</span>
                <span className="text-xs text-amber-400">{order.paymentStatus?.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <Package className="h-3 w-3 inline mr-1.5" />
                Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden border border-white/5">
                      {item.variant?.product?.images?.[0] ? (
                        <img
                          src={item.variant.product.images[0].url}
                          alt={item.variant.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {item.variant?.product?.name ?? 'Product'}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {item.variant?.color} · Size {item.variant?.sizeUK} · ×{item.quantity}
                      </p>
                    </div>
                    <p className="text-xs text-amber-400 font-medium flex-shrink-0">
                      PKR {(Number(item.unitPrice) * item.quantity).toLocaleString('en-PK')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Subtotal</span>
                <span>PKR {Number(Number(order.totalAmount) - Number(order.shippingCost) + Number(order.discountAmount)).toLocaleString('en-PK')}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-xs text-green-400">
                  <span>Discount</span>
                  <span>-PKR {Number(order.discountAmount).toLocaleString('en-PK')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Shipping</span>
                <span>PKR {Number(order.shippingCost).toLocaleString('en-PK')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="text-amber-400">PKR {Number(order.totalAmount).toLocaleString('en-PK')}</span>
              </div>
            </div>

            {/* Branch */}
            {order.branch && (
              <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Branch
                </h3>
                <p className="text-sm text-white">{order.branch.name}</p>
                <p className="text-xs text-zinc-400">{order.branch.city}</p>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notes</h3>
                <p className="text-xs text-zinc-300">{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data, isLoading } = api.order.getAll.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    status: status || undefined,
  });

  const { data: stats } = api.order.getStats.useQuery();

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => { void utils.order.getAll.invalidate(); },
  });

  const invalidateAll = () => {
    void utils.order.getAll.invalidate();
    void utils.order.getStats.invalidate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} total orders</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={invalidateAll}
          className="border-white/10 bg-transparent text-zinc-400 hover:text-white text-xs gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Package}
            label="Total Orders"
            value={stats.total}
            accent="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            icon={AlertTriangle}
            label="Pending Verification"
            value={stats.pending}
            accent="bg-orange-500/20 text-orange-400"
          />
          <StatCard
            icon={Truck}
            label="In Progress"
            value={stats.processing}
            accent="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue (Delivered)"
            value={`PKR ${Math.round(Number(stats.revenue ?? 0) / 1000)}k`}
            sub={`${stats.delivered} delivered`}
            accent="bg-green-500/20 text-green-400"
          />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by order # or customer name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-zinc-900 border-white/10 text-white"
          />
        </div>
        <Select onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56 bg-zinc-900 border-white/10 text-zinc-300">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-white text-xs">
                {STATUS_CONFIG[s]?.label ?? s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Branch</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Items</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading orders…
                  </td>
                </tr>
              )}
              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    No orders found
                  </td>
                </tr>
              )}
              {data?.items.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedOrderId(o.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-amber-400 font-bold">{o.orderNumber}</div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(o.createdAt).toLocaleDateString('en-PK')}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-xs text-white">{o.user?.name ?? 'Guest'}</div>
                    <div className="text-[11px] text-zinc-500">{o.user?.phone ?? o.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-400">
                    {o.branch?.name ?? '—'}
                    <div className="text-[10px] text-zinc-600">{o.branch?.city}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {o.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-[11px] text-zinc-400">
                          {item.variant?.product?.name?.slice(0, 22) ?? 'Product'} ×{item.quantity}
                        </div>
                      ))}
                      {o.items.length > 2 && (
                        <div className="text-[11px] text-zinc-600">+{o.items.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs font-bold text-white">
                      PKR {Number(o.totalAmount).toLocaleString('en-PK')}
                    </div>
                    <div className="text-[10px] text-zinc-500">{PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</div>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setSelectedOrderId(o.id)}
                        className="h-7 px-2 text-zinc-400 hover:text-white"
                        title="View order details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Select
                        onValueChange={(v) => updateStatus.mutate({ orderId: o.id, status: v as never })}
                      >
                        <SelectTrigger
                          className="w-28 h-7 bg-transparent border-white/10 text-zinc-400 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-white text-xs">
                              {STATUS_CONFIG[s]?.label ?? s.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-500">
              Page {page} of {data.totalPages} · {data.total} orders
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-7 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-7 px-2"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusUpdated={invalidateAll}
      />
    </div>
  );
}
