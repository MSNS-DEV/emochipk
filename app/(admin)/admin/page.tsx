'use client';

import { api } from '@/lib/trpc';
import { Package, ShoppingCart, Building2, TrendingUp, Users, AlertTriangle, RotateCcw } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = api.order.getStats.useQuery();
  const { data: products } = api.product.adminList.useQuery({ page: 1, pageSize: 5 });
  const { data: branches } = api.branch.adminList.useQuery();

  const fmt = (n: number | null | undefined) =>
    n ? `PKR ${Number(n).toLocaleString('en-PK')}` : 'PKR 0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Executive Mochi — Admin Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats?.total ?? '—'} icon={ShoppingCart} color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Pending" value={stats?.pending ?? '—'} icon={AlertTriangle} color="bg-amber-500/20 text-amber-400" />
        <StatCard label="Processing" value={stats?.processing ?? '—'} icon={TrendingUp} color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Delivered" value={stats?.delivered ?? '—'} icon={Package} color="bg-green-500/20 text-green-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Products</h2>
            <a href="/admin/products" className="text-xs text-amber-400 hover:text-amber-300">View all →</a>
          </div>
          <div className="space-y-3">
            {products?.items.map((p) => (
              <a key={p.id} href={`/admin/products?edit=${p.id}`} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  {p.images[0] ? (
                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.articleNumber} · {p._count.variants} variants</div>
                </div>
                <div className="text-xs font-medium text-amber-400">
                  PKR {Number(p.salePrice ?? p.basePrice).toLocaleString('en-PK')}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Branches */}
        <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Branches</h2>
            <a href="/admin/branches" className="text-xs text-amber-400 hover:text-amber-300">Manage →</a>
          </div>
          <div className="space-y-3">
            {branches?.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white">{b.name}</div>
                  <div className="text-xs text-zinc-500">{b.city} · {b._count.inventory} SKUs · {b._count.orders} orders</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-2">Revenue (Delivered Orders)</h2>
        <div className="text-4xl font-bold text-amber-400">{fmt(stats?.revenue)}</div>
        <p className="text-xs text-zinc-500 mt-1">Total revenue from delivered orders</p>
      </div>
    </div>
  );
}
