'use client';

import { useSession } from 'next-auth/react';
import { api } from '@/lib/trpc';
import { ShoppingCart, Boxes, ArrowLeftRight, TrendingUp } from 'lucide-react';

export default function BranchDashboard() {
  const { data: session } = useSession();
  const { data: stats } = api.order.getStats.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Branch Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Welcome, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Pending Orders', value: stats?.pending ?? '—', icon: ShoppingCart, color: 'bg-amber-500/20 text-amber-400', href: '/branch/orders' },
          { label: 'Processing', value: stats?.processing ?? '—', icon: TrendingUp, color: 'bg-blue-500/20 text-blue-400', href: '/branch/orders' },
          { label: 'Delivered Today', value: stats?.delivered ?? '—', icon: TrendingUp, color: 'bg-green-500/20 text-green-400', href: '/branch/orders' },
        ].map((stat) => (
          <a key={stat.label} href={stat.href}
            className="bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </a>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <a href="/branch/orders" className="bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-white/10 flex items-center gap-4">
          <ShoppingCart className="h-8 w-8 text-amber-400" />
          <div>
            <div className="font-medium text-white">Order Fulfilment</div>
            <div className="text-xs text-zinc-500">Pack, dispatch and track orders for your branch</div>
          </div>
        </a>
        <a href="/branch/inventory" className="bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-white/10 flex items-center gap-4">
          <Boxes className="h-8 w-8 text-blue-400" />
          <div>
            <div className="font-medium text-white">Inventory Management</div>
            <div className="text-xs text-zinc-500">Stock levels, adjustments and low stock alerts</div>
          </div>
        </a>
        <a href="/branch/transfers" className="bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-white/10 flex items-center gap-4">
          <ArrowLeftRight className="h-8 w-8 text-purple-400" />
          <div>
            <div className="font-medium text-white">Stock Transfers</div>
            <div className="text-xs text-zinc-500">Digital Handshake — initiate, dispatch, receive</div>
          </div>
        </a>
      </div>
    </div>
  );
}
