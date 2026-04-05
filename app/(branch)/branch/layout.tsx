'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Boxes, ArrowLeftRight, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/branch', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/branch/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/branch/inventory', label: 'Inventory', icon: Boxes },
  { href: '/branch/transfers', label: 'Transfers', icon: ArrowLeftRight },
];

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-zinc-950"><div className="text-blue-400 animate-pulse">Loading…</div></div>;
  if (!session?.user || !['BRANCH_MANAGER', 'ADMIN'].includes(session.user.role)) redirect('/login');

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/5">
        <Link href="/branch" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">BM</div>
          <div>
            <div className="text-sm font-semibold text-white">Branch Portal</div>
            <div className="text-xs text-blue-400">Executive Mochi</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}
              onClick={() => setSidebarOpen(false)}>
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-medium text-white">{session.user.name}</div>
          <div className="text-xs text-zinc-500">Branch Manager</div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-400 hover:text-red-400"
          onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="hidden lg:flex w-56 flex-col fixed inset-y-0 left-0 bg-zinc-900 border-r border-white/5 z-30"><Sidebar /></aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-zinc-900 border-r border-white/5 flex flex-col">
            <button className="absolute top-4 right-4 text-zinc-400" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            <Sidebar />
          </aside>
        </div>
      )}
      <div className="lg:pl-56 flex-1 flex flex-col">
        <header className="sticky top-0 z-20 h-14 bg-zinc-950/80 backdrop-blur border-b border-white/5 flex items-center px-4">
          <button className="lg:hidden text-zinc-400 mr-4" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="text-xs text-blue-400 font-medium">BRANCH MANAGER</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
