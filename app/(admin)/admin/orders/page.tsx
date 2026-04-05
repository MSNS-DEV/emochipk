'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Clock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  PENDING_VERIFICATION: 'bg-orange-500/15 text-orange-400',
  VERIFIED: 'bg-blue-500/15 text-blue-400',
  PROCESSING: 'bg-indigo-500/15 text-indigo-400',
  PACKED: 'bg-cyan-500/15 text-cyan-400',
  SHIPPED: 'bg-purple-500/15 text-purple-400',
  OUT_FOR_DELIVERY: 'bg-amber-500/15 text-amber-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  RETURNED: 'bg-zinc-500/15 text-zinc-400',
};

const STATUSES = Object.keys(STATUS_COLORS);

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const utils = api.useUtils();

  const { data, isLoading } = api.order.getAll.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    status: status || undefined,
  });

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => void utils.order.getAll.invalidate(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Orders</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} total orders</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Order # or customer name…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-zinc-900 border-white/10 text-white" />
        </div>
        <Select onValueChange={(v) => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-52 bg-zinc-900 border-white/10 text-zinc-300">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-white text-xs">{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Branch</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Loading…</td></tr>}
              {data?.items.map((o) => (
                <tr key={o.id} className="hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-amber-400">{o.orderNumber}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(o.createdAt).toLocaleDateString('en-PK')}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-xs text-white">{o.user?.name ?? 'Guest'}</div>
                    <div className="text-xs text-zinc-500">{o.user?.phone ?? o.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-400">{o.branch?.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs font-medium text-white">PKR {Number(o.totalAmount).toLocaleString('en-PK')}</div>
                    <div className="text-xs text-zinc-500">{o.paymentMethod}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select onValueChange={(v) => updateStatus.mutate({ orderId: o.id, status: v as 'DELIVERED' })}>
                      <SelectTrigger className="w-32 h-7 bg-transparent border-white/10 text-zinc-400 text-xs">
                        <SelectValue placeholder="Update" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-white text-xs">{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs border-white/10 bg-transparent text-zinc-400">Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="text-xs border-white/10 bg-transparent text-zinc-400">Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
