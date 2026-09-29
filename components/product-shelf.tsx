'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/data';

export interface ProductShelfProps {
  /** Main category title, e.g. "Men's Luxury Handcrafted Leather" */
  title: string;
  /** Subtitle with shoe types or description, e.g. "Oxfords, Loafers, Moccasins, Peshawari Chappals" */
  subtitle?: string;
  /** Small category badge/eyebrow text */
  badgeText?: string;
  /** Badge icon component (optional) */
  badgeIcon?: React.ReactNode;
  /** Link to category shop page, e.g. "/shop?category=MEN" */
  viewAllHref: string;
  /** View All CTA label, e.g. "View All Men" */
  viewAllText?: string;
  /** Array of catalog products */
  products: CatalogProduct[];
  /** Optional theme styling for background: 'default' | 'stone' | 'muted' */
  variant?: 'default' | 'stone' | 'muted';
  /** Additional wrapper classes */
  className?: string;
}

export function ProductShelf({
  title,
  subtitle,
  badgeText,
  badgeIcon,
  viewAllHref,
  viewAllText = 'View All',
  products,
  variant = 'default',
  className,
}: ProductShelfProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Desktop mouse drag tracking
  const isMouseDownRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftStartRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);
  const clickCancelTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atLeft = el.scrollLeft <= 8;
    const atRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setCanScrollLeft(!atLeft);
    setCanScrollRight(!atRight);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check after layout paint
    const timer = setTimeout(checkScroll, 50);
    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products]);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (clickCancelTimerRef.current) {
        clearTimeout(clickCancelTimerRef.current);
      }
    };
  }, []);

  // Responsive scroll step calculation: scrolls by integer multiples of product card width + gap
  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    // Determine typical card width based on screen width
    const cardWidth = el.clientWidth >= 1024 ? 305 : el.clientWidth >= 768 ? 295 : 275;
    const numCards = Math.max(1, Math.floor(el.clientWidth / cardWidth));
    const scrollAmount = numCards * cardWidth;

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation for carousel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByDirection('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByDirection('right');
    }
  };

  // ── Drag-to-scroll implementation (smooth desktop swipe without stutter) ──
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag on primary left mouse button
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftStartRef.current = el.scrollLeft;

    // Window level listeners ensure dragging doesn't break if pointer leaves shelf bounds
    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isMouseDownRef.current || !scrollRef.current) return;
      const walk = (moveEvent.pageX - startXRef.current) * 1.25;

      if (Math.abs(walk) > 6) {
        if (!hasDraggedRef.current) {
          hasDraggedRef.current = true;
          setIsDragging(true);
        }
        // Direct scroll assignment while snapping is disabled gives 60fps tracking
        scrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
      }
    };

    const handleWindowMouseUp = () => {
      isMouseDownRef.current = false;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      // Keep hasDraggedRef true for a tiny window so any trailing click is suppressed, then reset
      if (clickCancelTimerRef.current) clearTimeout(clickCancelTimerRef.current);
      clickCancelTimerRef.current = setTimeout(() => {
        hasDraggedRef.current = false;
      }, 60);
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Intercept and swallow click event only if user was actively dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  const bgVariantClasses = {
    default: 'bg-background',
    stone: 'bg-stone-950 text-white',
    muted: 'bg-secondary/30',
  }[variant];

  const fadeLeftClass = {
    default: 'from-background via-background/80 to-transparent',
    stone: 'from-stone-950 via-stone-950/80 to-transparent',
    muted: 'from-secondary/30 via-secondary/20 to-transparent',
  }[variant];

  const fadeRightClass = {
    default: 'from-background via-background/80 to-transparent',
    stone: 'from-stone-950 via-stone-950/80 to-transparent',
    muted: 'from-secondary/30 via-secondary/20 to-transparent',
  }[variant];

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-12 sm:py-16 lg:py-20 transition-colors', bgVariantClasses, className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-1.5 max-w-2xl">
            {badgeText && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p
                className={cn(
                  'text-sm sm:text-base leading-relaxed',
                  variant === 'stone' ? 'text-stone-300' : 'text-muted-foreground'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Action buttons: View All + Desktop Chevrons */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-end">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                'border-primary/40 text-foreground hover:bg-primary hover:text-primary-foreground font-medium text-xs sm:text-sm',
                variant === 'stone' &&
                  'border-white/30 text-white hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400'
              )}
            >
              <Link href={viewAllHref}>
                {viewAllText}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>

            {/* Desktop Navigation Chevrons in Header */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollByDirection('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all border-border shadow-xs',
                  'hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400 disabled:opacity-25 disabled:pointer-events-none',
                  variant === 'stone' &&
                    'border-stone-800 text-stone-200 bg-stone-900/80 hover:bg-amber-400 hover:text-stone-950'
                )}
                aria-label={`Scroll ${title} backwards`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollByDirection('right')}
                disabled={!canScrollRight}
                className={cn(
                  'h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all border-border shadow-xs',
                  'hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400 disabled:opacity-25 disabled:pointer-events-none',
                  variant === 'stone' &&
                    'border-stone-800 text-stone-200 bg-stone-900/80 hover:bg-amber-400 hover:text-stone-950'
                )}
                aria-label={`Scroll ${title} forwards`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Carousel Container with Edge Fades & Side Chevrons */}
        <div className="relative group/carousel -mx-4 sm:mx-0">
          {/* Left Edge Fading Gradient */}
          <div
            className={cn(
              'pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r z-10 transition-opacity duration-300',
              fadeLeftClass,
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Right Edge Fading Gradient */}
          <div
            className={cn(
              'pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l z-10 transition-opacity duration-300',
              fadeRightClass,
              canScrollRight ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Floating Left Desktop Chevron - centered on image height */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByDirection('left')}
              className={cn(
                'hidden md:flex absolute left-3 top-[36%] -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full',
                'bg-background/95 dark:bg-stone-900/95 text-foreground shadow-xl border border-border/80 backdrop-blur-md',
                'hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400 hover:scale-110 active:scale-95 transition-all duration-200',
                variant === 'stone' &&
                  'bg-stone-900/95 text-white border-stone-700 hover:bg-amber-400 hover:text-stone-950'
              )}
              aria-label={`Previous ${title}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Floating Right Desktop Chevron - centered on image height */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByDirection('right')}
              className={cn(
                'hidden md:flex absolute right-3 top-[36%] -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full',
                'bg-background/95 dark:bg-stone-900/95 text-foreground shadow-xl border border-border/80 backdrop-blur-md',
                'hover:bg-amber-400 hover:text-stone-950 hover:border-amber-400 hover:scale-110 active:scale-95 transition-all duration-200',
                variant === 'stone' &&
                  'bg-stone-900/95 text-white border-stone-700 hover:bg-amber-400 hover:text-stone-950'
              )}
              aria-label={`Next ${title}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Horizontal Scroll Track */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onClickCapture={handleClickCapture}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex items-stretch gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-0 py-2 no-scrollbar',
              'touch-pan-x overscroll-x-contain select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
              // Disable CSS snap during mouse drag to eliminate jitter; snap cleanly when idle
              isDragging ? 'snap-none' : 'snap-x snap-mandatory'
            )}
            tabIndex={0}
            role="region"
            aria-label={`${title} carousel`}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[230px] sm:w-[260px] md:w-[275px] lg:w-[285px] shrink-0 snap-start flex flex-col"
              >
                <ProductCard product={product} className="h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
