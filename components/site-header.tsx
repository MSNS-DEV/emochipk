'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Menu, 
  Heart,
  LogOut,
  Package,
  MapPin,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { styleCategories, genderCategories, stylesByCategory } from '@/lib/data';

// Navigation items structure
const collectionNav = [
  { key: 'MEN', title: 'Gents (Men)', href: '/shop?category=MEN', styles: stylesByCategory.MEN },
  { key: 'WOMEN', title: 'Ladies (Women)', href: '/shop?category=WOMEN', styles: stylesByCategory.WOMEN },
  { key: 'KIDS', title: 'Youth / Kids', href: '/shop?category=KIDS', styles: stylesByCategory.KIDS },
  { key: 'ACCESSORIES', title: 'Accessories & Shoe Care', href: '/shop?category=ACCESSORIES', styles: [] },
];
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const navigation = [
  { name: 'Gents',            href: '/shop?category=MEN' },
  { name: 'Ladies',           href: '/shop?category=WOMEN' },
  { name: 'Kids',             href: '/shop?category=KIDS' },
  { name: 'Accessories',      href: '/shop?category=ACCESSORIES' },
  { name: 'Sale',             href: '/shop?filter=sale' },
];

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      {/* Top announcement bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-xs sm:text-sm font-sans tracking-wide text-center">
        <p className="font-medium">
          Complimentary Shipping on Orders Above PKR 5,000 | Handcrafted in Pakistan
        </p>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Mobile menu button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl tracking-tight">
                  Executive Mochi
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {/* Shop All Link */}
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 flex items-center"
                >
                  Shop All
                </Link>

                {/* Categories Section */}
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                    Collections & Styles
                  </p>
                  <div className="flex flex-col gap-2">
                    {collectionNav.map((col) => (
                      <div key={col.key} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold text-sm text-foreground py-1 border-b border-border/40">
                          <Link href={col.href} onClick={() => setIsMobileMenuOpen(false)}>
                            {col.title}
                          </Link>
                        </div>
                        <div className="pl-3 flex flex-col gap-1 my-1">
                          {col.styles.map((st) => (
                            <Link
                              key={st.id}
                              href={`/shop?category=${col.key}&style=${st.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="text-xs font-medium text-foreground/80 hover:text-amber-600 transition-colors py-1 flex items-center gap-2"
                            >
                              <span>{st.emoji}</span>
                              <span>{st.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                    Quick Links
                  </p>
                  <Link
                    href="/shop?filter=new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2 block"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/shop?filter=sale"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-destructive hover:text-destructive/80 transition-colors py-2 block"
                  >
                    Sale
                  </Link>
                </div>

                <div className="border-t border-border mt-4 pt-4" />
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Wishlist
                    </Link>
                    <button
                      onClick={() => {
                        void signOut({ callbackUrl: '/' });
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2 text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Executive Mochi Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
              Executive Mochi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/shop"
              className="text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors tracking-wider uppercase"
            >
              Shop All
            </Link>

            {collectionNav.map((col) => (
              <DropdownMenu key={col.key}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors tracking-wider uppercase outline-none">
                    {col.title} <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2 bg-popover border border-border shadow-xl">
                  <DropdownMenuItem asChild className="font-semibold text-amber-600 focus:bg-amber-500/10">
                    <Link href={col.href}>View All {col.title}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {col.styles.map((style) => (
                    <DropdownMenuItem key={style.id} asChild className="focus:bg-accent">
                      <Link href={`/shop?category=${col.key}&style=${style.id}`} className="flex items-center gap-2 text-xs py-1.5 cursor-pointer">
                        <span>{style.emoji}</span>
                        <span className="font-medium">{style.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            <Link
              href="/shop?filter=sale"
              className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors tracking-wider uppercase"
            >
              Sale 🔥
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="relative"
            >
              {isSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="sr-only">Search</span>
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>

            {/* Account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut({ callbackUrl: '/' })} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Sign In</span>
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative active:scale-95 transition-transform">
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center shadow-md animate-pulse-glow">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
                <span className="sr-only">Cart ({itemCount} items)</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="border-t border-border py-4 animate-in slide-in-from-top-2 duration-200">
            <form action="/shop" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                name="search"
                placeholder="Search for shoes, categories, styles..."
                className="w-full pl-10 pr-4 py-3 bg-secondary/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                autoFocus
              />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
