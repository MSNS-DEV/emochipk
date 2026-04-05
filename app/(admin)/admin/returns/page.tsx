'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  RECEIVED: 'bg-blue-500/15 text-blue-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400',
};

export default function AdminReturnsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const utils = api.useUtils();

  const { data, isLoading } = api.returns.getQueue.useQuery({
    page, pageSize: 20, status: status || undefined,
  });
  const approve = api.returns.approve.useMutation({ onSuccess: () => { toast.success('Approved'); void utils.returns.getQueue.invalidate(); } });
  const reject = api.returns.reject.useMutation({ onSuccess: () => { toast.success('Rejected'); void utils.returns.getQueue.invalidate(); } });
  const complete = api.returns.complete.useMutation({ onSuccess: () => { toast.success('Completed'); void utils.returns.getQueue.invalidate(); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Returns & Exchanges</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} requests</p>
        </div>
        <Select onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44 bg-zinc-900 border-white/10 text-zinc-300 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">Return #</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Customer</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Reason</th>
              <th className="text-left px-4 py-3">Resolution</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Loading…</td></tr>}
            {data?.items.map((r) => (
              <tr key={r.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-amber-400">{r.returnNumber}</div>
                  <div className="text-xs text-zinc-500">{r.order?.orderNumber}</div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-xs text-zinc-300">{r.customer?.user?.name ?? '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-400">{r.reason.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{r.resolution?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {r.status === 'PENDING' && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-400" onClick={() => approve.mutate({ returnId: r.id })}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => reject.mutate({ returnId: r.id, reason: 'Rejected by admin' })}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {r.status === 'RECEIVED' && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-400" onClick={() => complete.mutate({ returnId: r.id })}>
                        Complete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
