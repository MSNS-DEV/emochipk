'use client';

import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const utils = api.useUtils();

  const { data, isLoading } = api.review.getModerationQueue.useQuery({ page, pageSize: 20 });
  const approve = api.review.approve.useMutation({ onSuccess: () => { toast.success('Review approved'); void utils.review.getModerationQueue.invalidate(); } });
  const reject = api.review.reject.useMutation({ onSuccess: () => { toast.success('Review removed'); void utils.review.getModerationQueue.invalidate(); } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Review Moderation</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} pending reviews</p>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-zinc-500 text-sm py-6 text-center">Loading…</p>}
        {data?.items.map((r) => (
          <div key={r.id} className="bg-zinc-900 border border-white/5 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                  ))}</div>
                  <span className="text-xs text-zinc-500">by {r.customer?.user?.name ?? 'Anonymous'}</span>
                  <Badge variant="outline" className="text-xs border-white/10 text-zinc-500">{r.product?.name}</Badge>
                </div>
                {r.title && <div className="text-sm font-medium text-white mb-1">{r.title}</div>}
                {r.body && <p className="text-xs text-zinc-400 line-clamp-3">{r.body}</p>}
                <div className="text-xs text-zinc-600 mt-2">{new Date(r.createdAt).toLocaleDateString('en-PK')}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" className="h-8 bg-green-500/15 text-green-400 hover:bg-green-500/25 border-0"
                  onClick={() => approve.mutate(r.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" className="h-8 bg-red-500/15 text-red-400 hover:bg-red-500/25 border-0"
                  onClick={() => reject.mutate(r.id)}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        {data?.items.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400/40" />
            <p className="text-sm">All caught up! No pending reviews.</p>
          </div>
        )}
      </div>
    </div>
  );
}
