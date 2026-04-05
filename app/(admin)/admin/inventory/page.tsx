'use client';

import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Boxes, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface AdjustForm { variantId: string; branchId: string; quantity: number; reason: string; }

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdjust, setShowAdjust] = useState<{ variantId: string; branchId: string } | null>(null);
  const utils = api.useUtils();

  const { data: branches } = api.branch.adminList.useQuery();
  const [branchId, setBranchId] = useState('ALL');

  const { data, isLoading } = api.inventory.getAggregate.useQuery({ search: search || undefined, page, pageSize: 50 });

  const adjust = api.inventory.adjust.useMutation({
    onSuccess: () => { toast.success('Stock adjusted'); setShowAdjust(null); void utils.inventory.getAggregate.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, reset } = useForm<AdjustForm>();

  const displayData = branchId === 'ALL' ? data?.items : data?.items.filter((i) => i.branchId === branchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Inventory</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} records across all branches</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search by SKU or product…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-zinc-900 border-white/10 text-white" />
        </div>
        <Select onValueChange={setBranchId} defaultValue="ALL">
          <SelectTrigger className="w-48 bg-zinc-900 border-white/10 text-zinc-300">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white">All Branches</SelectItem>
            {branches?.map((b) => <SelectItem key={b.id} value={b.id} className="text-white text-xs">{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">SKU</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Branch</th>
                <th className="text-center px-4 py-3">Qty</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Reserved</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && <tr><td colSpan={6} className="py-10 text-center text-zinc-500">Loading…</td></tr>}
              {displayData?.map((inv) => (
                <tr key={`${inv.branchId}-${inv.variantId}`} className="hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-white">{inv.variant?.product?.name}</div>
                    <div className="text-xs text-zinc-500">{inv.variant?.color} · UK {inv.variant?.sizeUK}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-zinc-400">{inv.variant?.sku}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-400">{inv.branch?.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${inv.quantity <= 5 ? 'text-red-400' : inv.quantity <= 10 ? 'text-amber-400' : 'text-green-400'}`}>
                      {inv.quantity}
                    </span>
                    {inv.quantity <= 5 && <AlertTriangle className="h-3 w-3 text-red-400 inline ml-1" />}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-xs text-zinc-500">{inv.reserved ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-amber-400"
                      onClick={() => { setShowAdjust({ variantId: inv.variantId, branchId: inv.branchId }); reset({ variantId: inv.variantId, branchId: inv.branchId }); }}>
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!showAdjust} onOpenChange={() => setShowAdjust(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle>Stock Adjustment</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => adjust.mutate(({ ...d, quantity: Number(d.quantity) })))} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Quantity Change (use negative for reduction)</Label>
              <Input {...register('quantity')} type="number" placeholder="-5 or +10" className="bg-zinc-900 border-white/10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Reason *</Label>
              <Input {...register('reason')} placeholder="Damaged goods, Stock count, etc." className="bg-zinc-900 border-white/10" />
            </div>
            <DialogFooter>
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
