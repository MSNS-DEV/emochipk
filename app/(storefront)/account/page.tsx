'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  CreditCard, 
  Settings, 
  LogOut,
  ChevronRight,
  Wallet,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const accountLinks = [
  {
    title: 'My Orders',
    description: 'Track, return, or buy things again',
    href: '/account/orders',
    icon: Package,
  },
  {
    title: 'Wishlist',
    description: 'Your saved items',
    href: '/wishlist',
    icon: Heart,
  },
  {
    title: 'Addresses',
    description: 'Manage your delivery addresses',
    href: '/account/addresses',
    icon: MapPin,
  },
  {
    title: 'Size Memory',
    description: 'Your saved sizes for faster checkout',
    href: '/account/sizes',
    icon: User,
  },
  {
    title: 'Store Credits',
    description: 'View your store credit balance',
    href: '/account/credits',
    icon: CreditCard,
  },
  {
    title: 'Loyalty Points',
    description: 'Check your rewards and tier status',
    href: '/account/loyalty',
    icon: Star,
  },
  {
    title: 'Account Settings',
    description: 'Update your profile and password',
    href: '/account/settings',
    icon: Settings,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-secondary/30 py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight mb-2">
                Welcome, {user.name}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Wishlist</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">PKR 0</p>
                <p className="text-sm text-muted-foreground">Store Credit</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <link.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Admin/Manager Access */}
        {(user.role === 'ADMIN' || user.role === 'BRANCH_MANAGER') && (
          <div className="mt-12 p-6 rounded-lg bg-primary/5 border border-primary/20">
            <h3 className="font-semibold mb-2">Staff Access</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have {user.role === 'ADMIN' ? 'administrator' : 'branch manager'} access.
            </p>
            <Button asChild>
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Go to Admin Dashboard
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
