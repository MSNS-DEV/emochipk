'use client';

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  X,
  Grid3X3,
  LayoutGrid,
  Grid2X2,
  SlidersHorizontal,
  Search,
  ArrowUp,
  Sparkles,
  Tag,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ProductCard, ProductCardSkeleton } from '@/components/product-card';
import { CollectionCoverBackground } from '@/components/collection-cover-bg';
import { api } from '@/lib/trpc';
import {
  formatPrice,
  styleCategories,
  stylesByCategory,
  getStylesForCategory,
  getStyleLabel,
  genderCategories,
  knownBrands,
  menSizesUK,
  menSizesEU,
  womenSizesUK,
  womenSizesEU,
  kidsSubGroups,
  getDbStyle,
} from '@/lib/utils/catalog';
import { getProductColors, type CatalogProduct } from '@/lib/data';

const allColors = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Gold', hex: '#CFB53B' },
  { name: 'Navy', hex: '#1a1a3e' },
  { name: 'Cognac', hex: '#9A463D' },
  { name: 'Olive', hex: '#808000' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
] as const;

// Collection tabs — 4 tabs, each with its own category-specific style sub-chips
const collectionTabs = [
  {
    id: 'MEN',
    label: 'Men',
    emoji: '👞',
    filter: { category: 'MEN' as const },
    styles: [
      { label: 'All Gents', filter: { category: 'MEN' as const } },
      ...stylesByCategory.MEN.map((s) => ({
        label: `${s.emoji} ${s.label}`,
        filter: { category: 'MEN' as const, style: s.id },
      })),
      { label: 'On Sale 🔥', filter: { category: 'MEN' as const, onSale: true as const } },
      { label: 'Featured ★', filter: { category: 'MEN' as const, featured: true as const } },
    ],
  },
  {
    id: 'WOMEN',
    label: 'Women',
    emoji: '👡',
    filter: { category: 'WOMEN' as const },
    styles: [
      { label: 'All Ladies', filter: { category: 'WOMEN' as const } },
      ...stylesByCategory.WOMEN.map((s) => ({
        label: `${s.emoji} ${s.label}`,
        filter: { category: 'WOMEN' as const, style: s.id },
      })),
      { label: 'On Sale 🔥', filter: { category: 'WOMEN' as const, onSale: true as const } },
      { label: 'Featured ★', filter: { category: 'WOMEN' as const, featured: true as const } },
    ],
  },
  {
    id: 'KIDS',
    label: 'Youth / Kids',
    emoji: '🎒',
    filter: { category: 'KIDS' as const },
    styles: [
      { label: 'All Youth / Kids', filter: { category: 'KIDS' as const } },
      ...stylesByCategory.KIDS.map((s) => ({
        label: `${s.emoji} ${s.label}`,
        filter: { category: 'KIDS' as const, style: s.id },
      })),
      { label: 'On Sale 🔥', filter: { category: 'KIDS' as const, onSale: true as const } },
    ],
  },
  {
    id: 'ACCESSORIES',
    label: 'Accessories',
    emoji: '🧦',
    filter: { category: 'ACCESSORIES' as const },
    styles: [
      { label: 'All Accessories', filter: { category: 'ACCESSORIES' as const } },
      { label: 'Shoe Polish & Care', filter: { category: 'ACCESSORIES' as const, search: 'Polish' } },
      { label: 'Shoe Cream', filter: { category: 'ACCESSORIES' as const, search: 'Cream' } },
      { label: 'Shoe Brushes', filter: { category: 'ACCESSORIES' as const, search: 'Brush' } },
      { label: 'Insoles & Comfort', filter: { category: 'ACCESSORIES' as const, search: 'Insole' } },
      { label: 'Socks & Hosiery', filter: { category: 'ACCESSORIES' as const, search: 'Socks' } },
      { label: 'On Sale 🔥', filter: { category: 'ACCESSORIES' as const, onSale: true as const } },
      { label: 'Featured ★', filter: { category: 'ACCESSORIES' as const, featured: true as const } },
    ],
  },
  {
    id: 'ALL_STYLES',
    label: 'All Styles',
    emoji: '✨',
    filter: {},
    styles: [
      { label: 'All Products', filter: {} },
      ...styleCategories.map((s) => ({
        label: `${s.emoji} ${s.label}`,
        filter: { style: s.id },
      })),
      { label: 'On Sale 🔥', filter: { onSale: true as const } },
      { label: 'Featured ★', filter: { featured: true as const } },
    ],
  },
] as const;

interface ShopFilters {
  style?: string;
  category?: string;
  brand?: string;
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  onSale?: boolean;
  featured?: boolean;
  sortBy?: string;
  search?: string;
}

/** Parse all filter state from URL search params */
function parseFiltersFromParams(searchParams: URLSearchParams): {
  filters: ShopFilters;
  priceRange: [number, number];
  page: number;
} {
  const filterParam = searchParams.get('filter');
  const sizesParam = searchParams.get('sizes');
  const colorsParam = searchParams.get('colors');
  const priceMinParam = searchParams.get('priceMin');
  const priceMaxParam = searchParams.get('priceMax');
  const pageParam = searchParams.get('page');

  const priceMin = priceMinParam ? Number(priceMinParam) : 0;
  const priceMax = priceMaxParam ? Number(priceMaxParam) : 20000;

  return {
    filters: {
      sortBy: searchParams.get('sortBy') ?? 'newest',
      style: searchParams.get('style') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      sizes: sizesParam ? sizesParam.split(',').filter(Boolean) : undefined,
      colors: colorsParam ? colorsParam.split(',').filter(Boolean) : undefined,
      onSale: filterParam === 'sale' || searchParams.get('onSale') === 'true' ? true : undefined,
      featured: filterParam === 'featured' || searchParams.get('featured') === 'true' ? true : undefined,
      search: searchParams.get('search') ?? searchParams.get('q') ?? undefined,
    },
    priceRange: [priceMin, priceMax],
    page: pageParam ? Number(pageParam) : 1,
  };
}

/** Build URLSearchParams from current filter state */
function buildSearchParams(
  filters: ShopFilters,
  priceRange: [number, number],
  page: number
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.style) params.set('style', filters.style);
  if (filters.category) params.set('category', filters.category);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.sizes?.length) params.set('sizes', filters.sizes.join(','));
  if (filters.colors?.length) params.set('colors', filters.colors.join(','));
  if (priceRange[0] > 0) params.set('priceMin', String(priceRange[0]));
  if (priceRange[1] < 20000) params.set('priceMax', String(priceRange[1]));
  if (filters.onSale) params.set('onSale', 'true');
  if (filters.featured) params.set('featured', 'true');
  if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
  if (filters.search) params.set('search', filters.search);
  if (page > 1) params.set('page', String(page));

  return params;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL
  const initial = useMemo(() => parseFiltersFromParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filters, setFilters] = useState<ShopFilters>(initial.filters);
  const [priceRange, setPriceRange] = useState<[number, number]>(initial.priceRange);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [page, setPage] = useState(initial.page);
  const [searchInput, setSearchInput] = useState(initial.filters.search ?? '');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Derive active tab from current filters
  const activeTabId = useMemo(() => {
    if (filters.category === 'MEN') return 'MEN';
    if (filters.category === 'WOMEN') return 'WOMEN';
    if (filters.category === 'KIDS') return 'KIDS';
    return 'ACCESSORIES';
  }, [filters.category]);

  // Floating scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync state → URL (debounced for price & search)
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUrl = useCallback(
    (currentFilters: ShopFilters, currentPriceRange: [number, number], currentPage: number) => {
      const params = buildSearchParams(currentFilters, currentPriceRange, currentPage);
      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Update URL when filters or page change
  useEffect(() => {
    updateUrl(filters, priceRange, page);
  }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: val.trim() || undefined }));
      setPage(1);
    }, 350);
  };

  // Debounce price slider
  useEffect(() => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      updateUrl(filters, priceRange, page);
    }, 400);
    return () => {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    };
  }, [priceRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isFetching } = api.product.getAll.useQuery({
    // Map virtual style IDs (SANDALS2, SNEAKERS2) to real DB enum values
    style: filters.style ? getDbStyle(filters.style) as never : undefined,
    category: filters.category as never,
    brand: filters.brand,
    onSale: filters.onSale,
    featured: filters.featured,
    sizes: filters.sizes,
    colors: filters.colors,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 20000 ? priceRange[1] : undefined,
    sortBy: filters.sortBy as never,
    search: filters.search,
    page,
    pageSize: 12,
  });

  // Fetch live brands from DB
  const { data: liveBrands } = api.product.getBrands.useQuery();

  // Query background images specifically for the active collection cover background
  const { data: bgData } = api.product.getAll.useQuery({
    category: filters.category as never,
    style: filters.style ? (getDbStyle(filters.style) as never) : undefined,
    pageSize: 40,
  });

  // Query general catalog products as fallback so cover background is always populated
  const { data: allCatalogData } = api.product.getAll.useQuery({
    pageSize: 40,
  });

  const collectionHeroImages = useMemo(() => {
    const urls: string[] = [];
    const primaryProducts = bgData?.items?.length ? bgData.items : (data?.items || []);
    const fallbackProducts = allCatalogData?.items || [];

    // Extract images from primary active collection
    (primaryProducts as unknown as CatalogProduct[]).forEach((prod) => {
      if (prod.images && prod.images.length > 0) {
        prod.images.forEach((img) => {
          if (img?.url) urls.push(img.url);
        });
      }
    });

    // If active collection has few images, top up with general catalog images
    if (urls.length < 15) {
      (fallbackProducts as unknown as CatalogProduct[]).forEach((prod) => {
        if (prod.images && prod.images.length > 0) {
          prod.images.forEach((img) => {
            if (img?.url) urls.push(img.url);
          });
        }
      });
    }

    return Array.from(new Set(urls));
  }, [bgData?.items, data?.items, allCatalogData?.items]);

  // Expand products with > 1 active colors into separate cards
  const shopProductItems = useMemo(() => {
    if (!data?.items) return [];

    const items: { product: CatalogProduct; displayColor?: string; key: string }[] = [];

    (data.items as unknown as CatalogProduct[]).forEach((product) => {
      const colors = getProductColors(product);
      const activeColors = filters.colors?.length
        ? colors.filter((c) => filters.colors?.includes(c.name))
        : colors;

      if (activeColors.length > 1) {
        activeColors.forEach((c) => {
          items.push({
            product,
            displayColor: c.name,
            key: `${product.id}-${c.name}`,
          });
        });
      } else {
        items.push({
          product,
          displayColor: activeColors[0]?.name ?? undefined,
          key: product.id,
        });
      }
    });

    return items;
  }, [data?.items, filters.colors]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.style) n++;
    if (filters.category) n++;
    if (filters.brand) n++;
    if (filters.sizes?.length) n += filters.sizes.length;
    if (filters.colors?.length) n += filters.colors.length;
    if (filters.onSale) n++;
    if (filters.featured) n++;
    if (priceRange[0] > 0 || priceRange[1] < 20000) n++;
    if (filters.search) n++;
    return n;
  }, [filters, priceRange]);

  const clearAll = () => {
    setFilters({ sortBy: filters.sortBy });
    setPriceRange([0, 20000]);
    setSearchInput('');
    setPage(1);
  };

  const displayBrands = useMemo(() => {
    if (liveBrands && liveBrands.length > 0) return liveBrands;
    return [...knownBrands];
  }, [liveBrands]);

  const pageTitle = filters.onSale
    ? 'On Sale'
    : filters.featured
    ? 'Featured Collection'
    : filters.style
    ? styleCategories.find((s) => s.id === filters.style)?.label ?? 'Products'
    : filters.category
    ? genderCategories.find((g) => g.id === filters.category)?.label ?? 'Products'
    : 'All Products';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FilterContent = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Brand */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Brand
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {displayBrands.map((brand) => (
            <button
              key={brand}
              onClick={() => {
                setFilters((f) => ({
                  ...f,
                  brand: f.brand === brand ? undefined : brand,
                }));
                setPage(1);
              }}
              className={`h-7 px-2.5 rounded-md border text-xs font-medium transition-all active:scale-95 ${
                filters.brand === brand
                  ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                  : 'border-border hover:border-amber-400 text-muted-foreground'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Footwear Style
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {getStylesForCategory(filters.category).map((cat) => {
            const dbStyle = (cat as { dbStyle?: string }).dbStyle ?? cat.id;
            const isActive = filters.style === cat.id || (filters.style && getDbStyle(filters.style) === dbStyle);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setFilters((f) => ({
                    ...f,
                    style: isActive ? undefined : cat.id,
                  }));
                  setPage(1);
                }}
                className={`h-7 px-2.5 rounded-full border text-xs font-medium transition-all active:scale-95 flex items-center gap-1 ${
                  isActive
                    ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                    : 'border-border hover:border-amber-400 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Collection
        </h4>
        <div className="space-y-2">
          {genderCategories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={filters.category === cat.id}
                onCheckedChange={(checked) => {
                  setFilters((f) => ({
                    ...f,
                    category: checked ? cat.id : undefined,
                  }));
                  setPage(1);
                }}
                className="h-4 w-4"
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-xs sm:text-sm cursor-pointer select-none">
                {cat.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Size {filters.category === 'KIDS' ? '(Kids)' : '(UK / EU)'}
        </h4>

        {filters.category !== 'KIDS' && (
          <div className="space-y-3">
            {(!filters.category || filters.category === 'MEN') && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Men · UK
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {menSizesUK.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.includes(size)
                            ? f.sizes.filter((s) => s !== size)
                            : [...(f.sizes ?? []), size],
                        }));
                        setPage(1);
                      }}
                      className={`h-8 min-w-[2.25rem] px-2 rounded-md border text-xs font-semibold transition-all active:scale-95 ${
                        filters.sizes?.includes(size)
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-border hover:border-amber-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!filters.category || filters.category === 'MEN') && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Men · EU
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {menSizesEU.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.includes(size)
                            ? f.sizes.filter((s) => s !== size)
                            : [...(f.sizes ?? []), size],
                        }));
                        setPage(1);
                      }}
                      className={`h-8 min-w-[2.25rem] px-2 rounded-md border text-xs font-semibold transition-all active:scale-95 ${
                        filters.sizes?.includes(size)
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-border hover:border-amber-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!filters.category || filters.category === 'WOMEN') && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Women · UK
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {womenSizesUK.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.includes(size)
                            ? f.sizes.filter((s) => s !== size)
                            : [...(f.sizes ?? []), size],
                        }));
                        setPage(1);
                      }}
                      className={`h-8 min-w-[2.25rem] px-2 rounded-md border text-xs font-semibold transition-all active:scale-95 ${
                        filters.sizes?.includes(size)
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-border hover:border-amber-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!filters.category || filters.category === 'WOMEN') && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                  Women · EU
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {womenSizesEU.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.includes(size)
                            ? f.sizes.filter((s) => s !== size)
                            : [...(f.sizes ?? []), size],
                        }));
                        setPage(1);
                      }}
                      className={`h-8 min-w-[2.25rem] px-2 rounded-md border text-xs font-semibold transition-all active:scale-95 ${
                        filters.sizes?.includes(size)
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-border hover:border-amber-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {filters.category === 'KIDS' && (
          <div className="space-y-4">
            {Object.entries(kidsSubGroups).map(([key, group]) => (
              <div key={key} className="space-y-1.5 border-b border-border/40 pb-2.5 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    {group.label} Collection
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {group.ageGroup}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">UK Sizes: {group.uk.join(', ')}</p>
                  <p className="text-[10px] text-muted-foreground">EU / English: {group.eu.join(', ')}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[...new Set([...group.uk, ...group.eu])].map((size) => (
                    <button
                      key={`${key}-${size}`}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.includes(size)
                            ? f.sizes.filter((s) => s !== size)
                            : [...(f.sizes ?? []), size],
                        }));
                        setPage(1);
                      }}
                      className={`h-8 min-w-[2.25rem] px-2 rounded-md border text-xs font-semibold transition-all active:scale-95 ${
                        filters.sizes?.includes(size)
                          ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                          : 'border-border hover:border-amber-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Color
        </h4>
        <div className="flex flex-wrap gap-2">
          {allColors.map((color) => {
            const isSelected = filters.colors?.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  setFilters((f) => ({
                    ...f,
                    colors: f.colors?.includes(color.name)
                      ? f.colors.filter((c) => c !== color.name)
                      : [...(f.colors ?? []), color.name],
                  }));
                  setPage(1);
                }}
                className={`h-8 w-8 rounded-full border-2 transition-all active:scale-90 flex items-center justify-center ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2 scale-110'
                    : 'border-border hover:scale-110'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {isSelected && (
                  <Check
                    className={`h-3.5 w-3.5 ${
                      color.name === 'White' || color.name === 'Beige'
                        ? 'text-black'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Slider */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Price Range
        </h4>
        <Slider
          min={0}
          max={20000}
          step={500}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs font-mono font-medium text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 uppercase tracking-wider text-muted-foreground">
          Status &amp; Specials
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-sale"
              checked={filters.onSale ?? false}
              onCheckedChange={(checked) => {
                setFilters((f) => ({
                  ...f,
                  onSale: checked ? true : undefined,
                }));
                setPage(1);
              }}
            />
            <Label htmlFor="filter-sale" className="text-xs sm:text-sm cursor-pointer select-none">
              On Sale 🔥
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-featured"
              checked={filters.featured ?? false}
              onCheckedChange={(checked) => {
                setFilters((f) => ({
                  ...f,
                  featured: checked ? true : undefined,
                }));
                setPage(1);
              }}
            />
            <Label htmlFor="filter-featured" className="text-xs sm:text-sm cursor-pointer select-none">
              Featured ★
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-16">
      {/* ── Shop Hero Header — Cover Background with Shuffled Collection Images ── */}
      <div className="relative min-h-[240px] sm:min-h-[280px] flex items-center bg-stone-950 text-white overflow-hidden py-10 sm:py-14 border-b border-border/40">
        {/* Shuffled background images marquee of active collection */}
        <CollectionCoverBackground
          images={collectionHeroImages}
          collectionKey={`${filters.category || 'ALL'}-${filters.style || 'ALL'}`}
        />

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-3.5 py-1 mb-3 text-amber-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Executive Mochi · Handcrafted Collection</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
              {pageTitle}
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm font-medium drop-shadow-sm">
              {isLoading || isFetching
                ? 'Updating catalog...'
                : `${data?.total ?? 0} luxury articles available nationwide with Cash on Delivery`}
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="mt-6 max-w-md relative z-20">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              type="text"
              placeholder="Search by article # or name (e.g. EXM0906, Moccasin)..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-9 h-11 rounded-xl bg-stone-900/80 border-stone-700/60 backdrop-blur-md focus:ring-amber-500 text-white placeholder:text-stone-400 text-xs sm:text-sm shadow-lg"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setFilters((f) => ({ ...f, search: undefined }));
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-amber-400 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Collection Tabs + Style Sub-chips ── */}
      <div className="sticky top-16 lg:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        {/* Tab row — centered, bigger, premium feel */}
        <div className="container mx-auto px-4">
          <div className="flex items-stretch justify-center gap-0 overflow-x-auto no-scrollbar">
            {collectionTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({
                      sortBy: f.sortBy,
                      search: f.search,
                      category: tab.id,
                    }));
                    setPage(1);
                  }}
                  className={`shrink-0 flex items-center gap-2 px-6 sm:px-8 py-4 sm:py-5 text-sm sm:text-base font-bold border-b-[3px] transition-all duration-200 whitespace-nowrap tracking-wide ${
                    isActive
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-secondary/40'
                  }`}
                >
                  <span className="text-base sm:text-lg">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style sub-chips for active tab */}
        <div className="border-t border-border/30 bg-secondary/30 py-2.5">
          <div className="container mx-auto px-4 overflow-x-auto no-scrollbar flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
            {collectionTabs.find((t) => t.id === activeTabId)?.styles.map((item, idx) => {
              const f = item.filter as ShopFilters & { onSale?: boolean; featured?: boolean };
              const isActive =
                (f.style ? filters.style === f.style : !filters.style) &&
                (f.category ? filters.category === f.category : filters.category === activeTabId) &&
                (!f.onSale || !!filters.onSale) &&
                (!f.featured || !!filters.featured) &&
                (f.onSale ? !!filters.onSale : !filters.onSale) &&
                (f.featured ? !!filters.featured : !filters.featured);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({
                      sortBy: prev.sortBy,
                      search: prev.search,
                      ...f,
                    }));
                    setPage(1);
                  }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                      : 'bg-card border border-border/60 text-muted-foreground hover:border-amber-400 hover:text-foreground hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Catalog Grid & Sidebar Section ── */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-36 bg-card/60 p-5 rounded-2xl border border-border/40 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                  <h3 className="font-serif text-lg font-bold">Filters</h3>
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs text-amber-600 hover:text-amber-700 h-8 px-2"
                  >
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Catalog Content Area */}
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 pb-4 border-b border-border/40">
              {/* Mobile Filter Button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden h-10 text-xs font-semibold rounded-xl"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-amber-500" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 bg-amber-500 text-white font-bold text-xs h-5 px-1.5">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[360px] p-6">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-xl font-bold flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-amber-500" />
                      Filter Footwear
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-190px)] pr-2">
                    <FilterContent />
                  </div>
                  <SheetFooter className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm"
                    >
                      Show {data?.total ?? 0} Products
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              {/* Active Badges */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {filters.style && (
                  <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 rounded-lg border">
                    Style: {styleCategories.find((s) => s.id === filters.style)?.label}
                    <button
                      onClick={() => setFilters((f) => ({ ...f, style: undefined }))}
                      className="hover:text-amber-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 rounded-lg border">
                    Collection: {genderCategories.find((g) => g.id === filters.category)?.label}
                    <button
                      onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
                      className="hover:text-amber-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.brand && (
                  <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 rounded-lg border">
                    Brand: {filters.brand}
                    <button
                      onClick={() => setFilters((f) => ({ ...f, brand: undefined }))}
                      className="hover:text-amber-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.sizes?.map((sz) => (
                  <Badge key={sz} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5 rounded-lg border">
                    Size: {sz}
                    <button
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          sizes: f.sizes?.filter((s) => s !== sz),
                        }))
                      }
                      className="hover:text-amber-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-7 text-xs text-amber-600 hover:text-amber-700 font-medium px-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* View Switcher & Sorting */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                {/* Responsive Grid Column Switcher */}
                <div className="flex items-center border border-border/60 rounded-xl overflow-hidden bg-card/60 p-0.5 shadow-2xs">
                  {[2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setGridCols(cols as 2 | 3 | 4)}
                      className={`p-1.5 sm:p-2 transition-colors rounded-lg flex items-center justify-center ${
                        gridCols === cols
                          ? 'bg-amber-500 text-white font-bold'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      title={`${cols} columns`}
                    >
                      {cols === 2 ? (
                        <Grid2X2 className="h-4 w-4" />
                      ) : cols === 3 ? (
                        <Grid3X3 className="h-4 w-4" />
                      ) : (
                        <LayoutGrid className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}
                >
                  <SelectTrigger className="h-10 text-xs sm:text-sm w-[170px] rounded-xl bg-card border-border/60">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Product Grid or Shimmer Skeletons ── */}
            {isLoading ? (
              <div
                className={`grid gap-4 lg:gap-6 ${
                  gridCols === 2
                    ? 'grid-cols-2'
                    : gridCols === 4
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-3'
                }`}
              >
                {[...Array(12)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div
                  className={`grid gap-4 lg:gap-6 ${
                    gridCols === 2
                      ? 'grid-cols-2'
                      : gridCols === 4
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {shopProductItems.map((item, idx) => (
                    <div
                      key={item.key}
                      className="animate-fade-slide-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <ProductCard product={item.product as never} displayColor={item.displayColor} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 sm:mt-12 pt-6 border-t border-border/40">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => p - 1);
                        scrollToTop();
                      }}
                      size="sm"
                      className="h-10 px-5 text-xs font-semibold rounded-xl"
                    >
                      ← Previous Page
                    </Button>
                    <span className="text-xs font-mono font-medium text-muted-foreground px-4">
                      Page {page} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= data.totalPages}
                      onClick={() => {
                        setPage((p) => p + 1);
                        scrollToTop();
                      }}
                      size="sm"
                      className="h-10 px-5 text-xs font-semibold rounded-xl"
                    >
                      Next Page →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-16 sm:py-24 bg-card/40 rounded-3xl border border-dashed border-border/60">
                <div className="text-6xl mb-4 animate-bounce">👞</div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold mb-2">
                  No matching footwear found
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-xs sm:text-sm">
                  We couldn&apos;t find articles matching your selected filters or search keyword.
                </p>
                <Button
                  onClick={clearAll}
                  className="h-10 px-6 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md"
                >
                  Reset All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-amber-500 text-white shadow-xl hover:bg-amber-600 transition-all duration-300 active:scale-90 animate-fade-slide-up"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
