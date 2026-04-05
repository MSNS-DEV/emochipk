'use client';

import Link from 'next/link';
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
import { styleCategories, genderCategories } from '@/lib/data';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const navigation = [
  { name: 'Gents',          href: '/shop?category=MEN' },
  { name: 'Ladies',         href: '/shop?category=WOMEN' },
  { name: 'Peshawari',      href: '/shop?style=PESHAWARI' },
  { name: 'Formal Shoes',   href: '/shop?style=OXFORD' },
  { name: 'Chappal',        href: '/shop?style=SANDALS' },
  { name: 'Sneakers',       href: '/shop?style=SNEAKERS' },
  { name: 'Sale 🔥',        href: '/shop?filter=sale' },
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
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-sans tracking-wide">
        Free Shipping on Orders Above PKR 5,000 | Use Code WELCOME10 for 10% Off
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
                    Shop by Style
                  </p>
                  <div className="flex flex-col gap-1">
                    {styleCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?style=${cat.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                      >
                        {cat.emoji} {cat.label}
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 mt-4">
                    Shop by Collection
                  </p>
                  <div className="flex flex-col gap-1">
                    {genderCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                      >
                        {cat.label}
                      </Link>
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
          <Link href="/" className="flex items-center">
            <span className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
              Executive Mochi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-foreground/70 hover:text-foreground transition-colors tracking-wide uppercase",
                  item.name === 'Sale' && 'text-destructive hover:text-destructive/80'
                )}
              >
                {item.name}
              </Link>
            ))}
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
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
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
