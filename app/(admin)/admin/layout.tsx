'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, Package, Building2, Boxes, ShoppingCart,
  Users, RotateCcw, Star, LogOut, Menu, X, ChevronDown,
  TrendingUp, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/trpc';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/branches', label: 'Branches', icon: Building2 },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1209]">
        <div className="text-amber-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">EM</div>
          <div>
            <div className="text-sm font-semibold text-white">Executive Mochi</div>
            <div className="text-xs text-amber-400">Admin Panel</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
            {session.user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{session.user.name}</div>
            <div className="text-xs text-zinc-500 truncate">{session.user.email}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-zinc-400 hover:text-red-400"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 bg-zinc-900 border-r border-white/5 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-zinc-900 border-r border-white/5 flex flex-col">
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-60 flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 bg-zinc-950/80 backdrop-blur border-b border-white/5 flex items-center px-4 gap-4">
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">ADMIN</Badge>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
