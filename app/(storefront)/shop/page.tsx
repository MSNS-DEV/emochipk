'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Grid3X3, LayoutGrid, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product-card';
import { api } from '@/lib/trpc';
import { formatPrice, styleCategories, genderCategories } from '@/lib/utils/catalog';

const allSizes = ['3', '4', '5', '6', '7', '8', '9', '10', '11'];
const allColors = [
  { name: 'Black', hex: '#1a1a1a' }, { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#808080' }, { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Gold', hex: '#CFB53B' }, { name: 'Navy', hex: '#1a1a3e' },
  { name: 'Cognac', hex: '#9A463D' }, { name: 'Olive', hex: '#808000' },
];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
] as const;

interface ShopFilters {
  style?: string; category?: string; sizes?: string[]; colors?: string[];
  priceMin?: number; priceMax?: number; onSale?: boolean; featured?: boolean;
  sortBy?: string; search?: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const styleParam = searchParams.get('style');
  const categoryParam = searchParams.get('category');
  const searchQuery = searchParams.get('search');

  const [filters, setFilters] = useState<ShopFilters>({
    sortBy: 'newest',
    style: styleParam ?? undefined,
    category: categoryParam ?? undefined,
    onSale: filterParam === 'sale' ? true : undefined,
    featured: filterParam === 'featured' ? true : undefined,
    search: searchQuery ?? undefined,
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = api.product.getAll.useQuery({
    style: filters.style as never,
    category: filters.category as never,
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

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.style) n++;
    if (filters.category) n++;
    if (filters.sizes?.length) n++;
    if (filters.colors?.length) n++;
    if (filters.onSale) n++;
    if (priceRange[0] > 0 || priceRange[1] < 20000) n++;
    return n;
  }, [filters, priceRange]);

  const clearAll = () => {
    setFilters({ sortBy: filters.sortBy, search: filters.search });
    setPriceRange([0, 20000]);
    setPage(1);
  };

  const pageTitle = filters.onSale ? 'Sale'
    : filters.featured ? 'Featured Collection'
    : filters.style ? styleCategories.find((s) => s.id === filters.style)?.label ?? 'Products'
    : filters.category ? genderCategories.find((g) => g.id === filters.category)?.label ?? 'Products'
    : 'All Products';

  const FilterContent = () => (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 sm:mb-3 uppercase tracking-wider text-muted-foreground">Style</h4>
        <div className="space-y-2">
          {styleCategories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox id={`style-${cat.id}`} checked={filters.style === cat.id}
                onCheckedChange={(checked) => { setFilters((f) => ({ ...f, style: checked ? cat.id : undefined })); setPage(1); }} className="h-4 w-4" />
              <Label htmlFor={`style-${cat.id}`} className="text-xs sm:text-sm cursor-pointer">{cat.emoji} {cat.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 sm:mb-3 uppercase tracking-wider text-muted-foreground">Collection</h4>
        <div className="space-y-2">
          {genderCategories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox id={`cat-${cat.id}`} checked={filters.category === cat.id}
                onCheckedChange={(checked) => { setFilters((f) => ({ ...f, category: checked ? cat.id : undefined })); setPage(1); }} className="h-4 w-4" />
              <Label htmlFor={`cat-${cat.id}`} className="text-xs sm:text-sm cursor-pointer">{cat.label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 sm:mb-3 uppercase tracking-wider text-muted-foreground">Size (UK)</h4>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => (
            <button key={size} onClick={() => {
              setFilters((f) => ({ ...f, sizes: f.sizes?.includes(size) ? f.sizes.filter((s) => s !== size) : [...(f.sizes ?? []), size] }));
              setPage(1);
            }} className={`h-9 w-9 rounded-md border text-xs sm:text-sm font-medium transition-colors ${filters.sizes?.includes(size) ? 'border-amber-500 bg-amber-500 text-white' : 'border-border hover:border-amber-400'}`}>
              {size}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-2.5 sm:mb-3 uppercase tracking-wider text-muted-foreground">Color</h4>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {allColors.map((color) => (
            <button key={color.name} onClick={() => {
              setFilters((f) => ({ ...f, colors: f.colors?.includes(color.name) ? f.colors.filter((c) => c !== color.name) : [...(f.colors ?? []), color.name] }));
              setPage(1);
            }} className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 transition-all flex-shrink-0 ${filters.colors?.includes(color.name) ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2' : 'border-border hover:scale-110'}`}
              style={{ backgroundColor: color.hex }} title={color.name} />
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Price Range</h4>
        <Slider min={0} max={20000} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="mb-3" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="filter-sale" checked={filters.onSale ?? false}
              onCheckedChange={(checked) => { setFilters((f) => ({ ...f, onSale: checked ? true : undefined })); setPage(1); }} />
            <Label htmlFor="filter-sale" className="text-sm cursor-pointer">On Sale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="filter-featured" checked={filters.featured ?? false}
              onCheckedChange={(checked) => { setFilters((f) => ({ ...f, featured: checked ? true : undefined })); setPage(1); }} />
            <Label htmlFor="filter-featured" className="text-sm cursor-pointer">Featured</Label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="bg-muted/40 py-6 sm:py-8 lg:py-12 border-b">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-1">{pageTitle}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} products`}
            {filters.search && ` for "${filters.search}"`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-amber-600 hover:text-amber-700">Clear all</Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden h-9 text-xs sm:text-sm">
                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filters
                    {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-2"><FilterContent /></div>
                  <SheetFooter className="mt-4">
                    <Button onClick={() => setMobileFiltersOpen(false)} className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white text-sm">
                      View {data?.total ?? 0} Products
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <div className="hidden lg:flex items-center gap-1.5 flex-wrap flex-1">
                {filters.style && <Badge variant="secondary" className="gap-1 text-xs">
                  {styleCategories.find((s) => s.id === filters.style)?.label}
                  <button onClick={() => setFilters((f) => ({ ...f, style: undefined }))} title="Clear"><X className="h-3 w-3" /></button>
                </Badge>}
                {filters.category && <Badge variant="secondary" className="gap-1 text-xs">
                  {genderCategories.find((g) => g.id === filters.category)?.label}
                  <button onClick={() => setFilters((f) => ({ ...f, category: undefined }))} title="Clear"><X className="h-3 w-3" /></button>
                </Badge>}
                {filters.sizes?.map((sz) => <Badge key={sz} variant="secondary" className="gap-1 text-xs">UK {sz}
                  <button onClick={() => setFilters((f) => ({ ...f, sizes: f.sizes?.filter((s) => s !== sz) }))} title="Clear"><X className="h-3 w-3" /></button>
                </Badge>)}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
                  {[2, 4].map((c) => (
                    <button key={c} onClick={() => setGridCols(c as 2 | 4)}
                      className={`p-1.5 sm:p-2 transition-colors h-9 w-9 flex items-center justify-center ${gridCols === c ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      title={c === 2 ? '2 columns' : '4 columns'}>
                      {c === 2 ? <LayoutGrid className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
                <Select value={filters.sortBy} onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v }))}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm w-auto"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            )}

            {/* Product Grid */}
            {!isLoading && data && data.items.length > 0 ? (
              <>
                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {data.items.map((product) => (
                    <ProductCard key={product.id} product={product as never} />
                  ))}
                </div>
                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-8 sm:mt-10">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} size="sm" className="h-9 text-xs sm:text-sm">Previous</Button>
                    <span className="text-xs sm:text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
                    <Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} size="sm" className="h-9 text-xs sm:text-sm">Next</Button>
                  </div>
                )}
              </>
            ) : !isLoading && (
              <div className="text-center py-12 sm:py-20">
                <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
                <h3 className="font-serif text-lg sm:text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm">Try adjusting your filters or search terms</p>
                <Button onClick={clearAll} className="h-9 text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-white">Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
