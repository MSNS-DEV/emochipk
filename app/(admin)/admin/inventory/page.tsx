'use client';

import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  Search, AlertTriangle, Boxes, TrendingDown, ZapOff, ChevronLeft,
  ChevronRight, SlidersHorizontal, RefreshCw, Package,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface AdjustForm { variantId: string; branchId: string; quantity: number; reason: string; notes?: string; }

type StockFilter = 'ALL' | 'LOW' | 'OUT' | 'OK';

const STOCK_FILTERS: { key: StockFilter; label: string; color: string }[] = [
  { key: 'ALL', label: 'All Stock', color: 'text-zinc-400' },
  { key: 'OUT', label: 'Out of Stock', color: 'text-red-400' },
  { key: 'LOW', label: 'Low Stock', color: 'text-amber-400' },
  { key: 'OK',  label: 'Healthy',   color: 'text-green-400' },
];

function StockBar({ qty, threshold = 5 }: { qty: number; threshold?: number }) {
  const max = Math.max(qty, threshold * 4, 20);
  const pct = Math.min((qty / max) * 100, 100);
  const color = qty === 0 ? 'bg-red-500' : qty <= threshold ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; accent: string;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
        {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [showAdjust, setShowAdjust] = useState<{
    variantId: string; branchId: string; productName: string; sku: string; currentQty: number;
  } | null>(null);
  const utils = api.useUtils();

  const { data: branches } = api.branch.adminList.useQuery();
  const { data, isLoading } = api.inventory.getAggregate.useQuery({
    search: search || undefined, page, pageSize: 50,
  });

  const adjust = api.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      setShowAdjust(null);
      reset();
      void utils.inventory.getAggregate.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, watch } = useForm<AdjustForm>();
  const qtyWatch = watch('quantity');

  // Compute stats
  const stats = useMemo(() => {
    if (!data?.items) return { total: 0, low: 0, out: 0, ok: 0, totalUnits: 0 };
    const items = data.items;
    return {
      total: items.length,
      out: items.filter(i => i.quantity === 0).length,
      low: items.filter(i => i.quantity > 0 && i.quantity <= 5).length,
      ok:  items.filter(i => i.quantity > 5).length,
      totalUnits: items.reduce((s, i) => s + i.quantity, 0),
    };
  }, [data]);

  // Filter displayed rows
  const displayData = useMemo(() => {
    let items = data?.items ?? [];
    if (branchId !== 'ALL') items = items.filter(i => i.branchId === branchId);
    if (stockFilter === 'OUT') items = items.filter(i => i.quantity === 0);
    if (stockFilter === 'LOW') items = items.filter(i => i.quantity > 0 && i.quantity <= 5);
    if (stockFilter === 'OK')  items = items.filter(i => i.quantity > 5);
    return items;
  }, [data, branchId, stockFilter]);

  function getStockBadge(qty: number) {
    if (qty === 0) return <Badge className="text-xs bg-red-500/15 text-red-400 border-0">Out of Stock</Badge>;
    if (qty <= 5)  return <Badge className="text-xs bg-amber-500/15 text-amber-400 border-0">Low Stock</Badge>;
    return <Badge className="text-xs bg-green-500/15 text-green-400 border-0">In Stock</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} SKU records · {stats.totalUnits.toLocaleString()} total units</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void utils.inventory.getAggregate.invalidate()}
          className="border-white/10 bg-transparent text-zinc-400 hover:text-white text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Boxes}        label="Total SKUs"      value={stats.total}      sub={`${data?.total ?? 0} records`} accent="bg-blue-500/20 text-blue-400" />
        <StatCard icon={TrendingDown} label="Low Stock"       value={stats.low}        sub="≤5 units"                     accent="bg-amber-500/20 text-amber-400" />
        <StatCard icon={ZapOff}       label="Out of Stock"    value={stats.out}        sub="0 units"                      accent="bg-red-500/20 text-red-400" />
        <StatCard icon={Package}      label="Healthy Stock"   value={stats.ok}         sub=">5 units"                     accent="bg-green-500/20 text-green-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by SKU or product name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-zinc-900 border-white/10 text-white"
          />
        </div>
        <Select onValueChange={(v) => { setBranchId(v); setPage(1); }} defaultValue="ALL">
          <SelectTrigger className="w-full sm:w-44 bg-zinc-900 border-white/10 text-zinc-300 text-sm">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white text-xs">All Branches</SelectItem>
            {branches?.map((b) => (
              <SelectItem key={b.id} value={b.id} className="text-white text-xs">{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stock Status Filter Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5 w-fit">
        {STOCK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setStockFilter(f.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              stockFilter === f.key
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span className={`ml-1.5 text-xs ${f.color}`}>
                {f.key === 'OUT' ? stats.out : f.key === 'LOW' ? stats.low : stats.ok}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product / Variant</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">SKU</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Branch</th>
                <th className="text-center px-4 py-3">Qty</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Reserved</th>
                <th className="text-center px-4 py-3 hidden lg:table-cell">Available</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="text-sm">Loading inventory…</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && displayData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 text-sm">
                    No inventory records found
                  </td>
                </tr>
              )}
              {displayData.map((inv) => {
                const available = Math.max(0, inv.quantity - (inv.reserved ?? 0));
                return (
                  <tr
                    key={`${inv.branchId}-${inv.variantId}`}
                    className={`hover:bg-white/[0.02] transition-colors ${inv.quantity === 0 ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Color swatch */}
                        <div
                          className="w-6 h-6 rounded-full border border-white/10 flex-shrink-0"
                          style={{ backgroundColor: inv.variant?.colorHex ?? '#888' }}
                          title={inv.variant?.color}
                        />
                        <div>
                          <div className="text-xs font-medium text-white leading-tight">
                            {inv.variant?.product?.name}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {inv.variant?.color} · UK {inv.variant?.sizeUK}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-zinc-400">
                      {inv.variant?.sku}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-400">
                      {inv.branch?.name}
                      <div className="text-zinc-600 text-xs">{inv.branch?.city}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-base font-bold tabular-nums ${
                          inv.quantity === 0 ? 'text-red-400' :
                          inv.quantity <= 5 ? 'text-amber-400' : 'text-green-400'
                        }`}>
                          {inv.quantity}
                        </span>
                        <StockBar qty={inv.quantity} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell text-xs text-zinc-500">
                      {inv.reserved ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell text-xs font-medium text-white">
                      {available}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {getStockBadge(inv.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-white/10 bg-transparent text-zinc-400 hover:text-amber-400 hover:border-amber-500/40"
                        onClick={() => {
                          setShowAdjust({
                            variantId: inv.variantId,
                            branchId: inv.branchId,
                            productName: inv.variant?.product?.name ?? '',
                            sku: inv.variant?.sku ?? '',
                            currentQty: inv.quantity,
                          });
                          reset({ variantId: inv.variantId, branchId: inv.branchId });
                        }}
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-500">
              Page {page} of {data.totalPages} · {data.total} records
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Dialog */}
      <Dialog open={!!showAdjust} onOpenChange={() => { setShowAdjust(null); reset(); }}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Stock Adjustment</DialogTitle>
            {showAdjust && (
              <div className="mt-2 p-3 bg-zinc-900 rounded-lg border border-white/5 space-y-1">
                <p className="text-xs font-medium text-white">{showAdjust.productName}</p>
                <p className="text-xs text-zinc-500 font-mono">{showAdjust.sku}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-zinc-500">Current stock:</span>
                  <span className={`text-sm font-bold ${
                    showAdjust.currentQty === 0 ? 'text-red-400' :
                    showAdjust.currentQty <= 5 ? 'text-amber-400' : 'text-green-400'
                  }`}>{showAdjust.currentQty}</span>
                  {qtyWatch && (
                    <>
                      <span className="text-zinc-600">→</span>
                      <span className="text-sm font-bold text-blue-400">
                        {Math.max(0, showAdjust.currentQty + Number(qtyWatch))}
                      </span>
                      <span className="text-xs text-zinc-500">(after)</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => adjust.mutate({ ...d, quantity: Number(d.quantity) }))} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Quantity Change *</Label>
              <Input
                {...register('quantity', { required: true })}
                type="number"
                placeholder="+10 to restock, -5 to reduce"
                className="bg-zinc-900 border-white/10"
              />
              <p className="text-xs text-zinc-600">Positive to add stock, negative to remove</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Reason *</Label>
              <Input
                {...register('reason', { required: true })}
                placeholder="e.g. Stock count correction, Damaged goods, Restock"
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Notes (optional)</Label>
              <Input
                {...register('notes')}
                placeholder="Additional notes…"
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button" variant="outline"
                onClick={() => { setShowAdjust(null); reset(); }}
                className="border-white/10 bg-transparent text-zinc-400"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adjust.isPending} className="bg-amber-500 hover:bg-amber-600 text-black">
                {adjust.isPending ? 'Saving…' : 'Save Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
