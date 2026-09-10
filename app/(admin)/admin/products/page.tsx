'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Search, Edit, Trash2, Package, Eye, EyeOff, ImagePlus, X, Upload, Loader2,
  ChevronLeft, ChevronRight, Star, Tag, Layers, RefreshCw, AlertCircle,
  Filter, SlidersHorizontal, ArrowUpDown, Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { GMCSyncPanel } from '@/components/admin/gmc-sync-panel';
import { stylesByCategory, getStylesForCategory, getStyleLabel, knownBrands } from '@/lib/data';
import {
  ColorOption,
  DEFAULT_PRODUCT_COLORS,
  loadStoredColors,
  saveStoredColors,
} from '@/lib/colors';
import { ProductColorSelector } from '@/components/admin/product-color-selector';

// ─── Validated Image (with loading / error / retry) ───────────────────────────

function ValidatedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retries, setRetries] = useState(0);
  const maxRetries = 3;

  const handleRetry = useCallback(() => {
    if (retries < maxRetries) {
      setStatus('loading');
      setRetries(r => r + 1);
    }
  }, [retries]);

  const imgSrc = retries > 0 ? `${src}${src.includes('?') ? '&' : '?'}r=${retries}` : src;

  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 rounded">
          <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800 rounded gap-1 cursor-pointer"
          onClick={handleRetry} title={retries < maxRetries ? 'Click to retry' : 'Failed to load'}>
          <AlertCircle className="h-4 w-4 text-red-400" />
          {retries < maxRetries && <span className="text-[9px] text-zinc-500">Retry</span>}
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (retries < maxRetries) {
            setTimeout(handleRetry, 1000 * (retries + 1));
          } else {
            setStatus('error');
          }
        }}
      />
    </div>
  );
}

const STYLES = ['SPORTS', 'SNEAKERS', 'SKECHERS', 'FORMAL_MOCCASINS', 'LOAFERS_MOZA', 'CHAPPAL', 'SANDALS', 'PESHAWARI_KHUSSA', 'COURT_SHOES', 'CASUAL_SHOES', 'BUMPS', 'SCHOOL', 'ACCESSORIES', 'LOAFERS', 'OXFORD', 'MOCCASINS', 'PESHAWARI'] as const;
const CATEGORIES = ['MEN', 'WOMEN', 'KIDS', 'ACCESSORIES'] as const;
const LEATHER_TYPES = ['CALF_SKIN', 'GOAT_LEATHER', 'SUEDE', 'NUBUCK', 'PREMIUM_SYNTHETIC'] as const;
const OCCASIONS = ['ETHNIC', 'WEDDING', 'SPORTS', 'FORMAL', 'CASUAL'] as const;
// UK sizes (primary rows)
const SIZES_MEN_UK = ['6', '7', '8', '9', '10', '11'];
const SIZES_MEN_EU = ['39', '40', '41', '42', '43', '44', '45'];
const SIZES_MEN = [...SIZES_MEN_UK, ...SIZES_MEN_EU];

const SIZES_WOMEN_UK = ['3', '4', '5', '6', '7', '8'];
const SIZES_WOMEN_EU = ['36', '37', '38', '39', '40', '41', '42'];
const SIZES_WOMEN = [...SIZES_WOMEN_UK, ...SIZES_WOMEN_EU];

// 1. Youth (11-15 yrs)
const SIZES_KIDS_YOUTH_UK = ['2', '3', '4', '5', '6'];
const SIZES_KIDS_YOUTH_EU = ['35', '36', '37', '38', '39'];

// 2. Girls (7-11 yrs)
const SIZES_KIDS_GIRLS_UK = ['9', '10', '11', '12', '13', '1', '2'];
const SIZES_KIDS_GIRLS_EU = ['28', '29', '30', '31', '32', '33', '34'];

// 3. Boys (7-11 yrs)
const SIZES_KIDS_BOYS_UK = ['9', '10', '11', '12', '13', '1'];
const SIZES_KIDS_BOYS_EU = ['27', '28', '29', '30', '31', '32', '33'];

// 4. Children (2-6 yrs)
const SIZES_KIDS_CHILDREN_UK = ['1', '2', '3', '4', '5', '6'];
const SIZES_KIDS_CHILDREN_EU = ['21', '22', '23', '24', '25', '26'];

const SIZES_KIDS = Array.from(new Set([
  ...SIZES_KIDS_YOUTH_UK, ...SIZES_KIDS_YOUTH_EU,
  ...SIZES_KIDS_GIRLS_UK, ...SIZES_KIDS_GIRLS_EU,
  ...SIZES_KIDS_BOYS_UK, ...SIZES_KIDS_BOYS_EU,
  ...SIZES_KIDS_CHILDREN_UK, ...SIZES_KIDS_CHILDREN_EU,
]));

const COLORS: ColorOption[] = DEFAULT_PRODUCT_COLORS;

const sizeChart: Record<string, { us: string; eu: string; cm: string }> = {
  // Women UK sizes
  '3': { us: '5.5', eu: '36', cm: '22.5' }, '4': { us: '6.5', eu: '37', cm: '23.5' },
  '5': { us: '7.5', eu: '38', cm: '24.0' }, '6': { us: '8.5', eu: '39', cm: '24.5' },
  '7': { us: '9.5', eu: '40', cm: '25.5' }, '8': { us: '10.5', eu: '41', cm: '26.0' },
  // Men UK sizes
  '9': { us: '10', eu: '43', cm: '27.5' }, '10': { us: '11', eu: '44', cm: '28.5' },
  '11': { us: '12', eu: '45', cm: '29.5' },
  // Men EU sizes (direct EU)
  '39': { us: '6.5', eu: '39', cm: '24.5' }, '40': { us: '7', eu: '40', cm: '25.0' },
  '41': { us: '8', eu: '41', cm: '26.0' }, '42': { us: '9', eu: '42', cm: '26.5' },
  '43': { us: '10', eu: '43', cm: '27.5' }, '44': { us: '11', eu: '44', cm: '28.5' },
  '45': { us: '12', eu: '45', cm: '29.5' },
  // Women EU sizes (direct EU)
  '36': { us: '5.5', eu: '36', cm: '22.5' }, '37': { us: '6.5', eu: '37', cm: '23.5' },
  '38': { us: '7.5', eu: '38', cm: '24.0' },
  // Kids / Children EU sizes
  '21': { us: '1.5C', eu: '21', cm: '13.0' }, '22': { us: '2.5C', eu: '22', cm: '13.5' },
  '23': { us: '3.5C', eu: '23', cm: '14.5' }, '24': { us: '4.5C', eu: '24', cm: '15.0' },
  '25': { us: '5.5C', eu: '25', cm: '15.5' }, '26': { us: '6.5C', eu: '26', cm: '16.0' },
  '27': { us: '9.5K', eu: '27', cm: '16.5' }, '28': { us: '10K', eu: '28', cm: '17.0' },
  '29': { us: '11K', eu: '29', cm: '17.5' }, '30': { us: '12K', eu: '30', cm: '18.5' },
  '31': { us: '13K', eu: '31', cm: '19.5' }, '32': { us: '1.5', eu: '32', cm: '20.0' },
  '33': { us: '2', eu: '33', cm: '20.5' }, '34': { us: '2.5', eu: '34', cm: '21.0' },
  '35': { us: '3', eu: '35', cm: '21.5' },
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Product Form Schema ──────────────────────────────────────────────────────

const FormSchema = z.object({
  articleNumber: z.string().min(1, 'Required'),
  brand: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  description: z.string().min(1, 'At least 10 characters'),
  basePrice: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional(),
  category: z.enum(CATEGORIES),
  style: z.enum(STYLES),
  leatherType: z.enum(LEATHER_TYPES),
  occasion: z.array(z.string()).min(1, 'Select at least one'),
  manufacturingCity: z.string().min(1, 'Required'),
  isFeatured: z.boolean().default(false),
  selectedSizes: z.array(z.string()).min(1, 'Select at least one size'),
  selectedColors: z.array(z.string()).min(1, 'Select at least one color'),
  images: z.array(z.object({ url: z.string().min(1, 'Invalid URL'), isPrimary: z.boolean() })).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

// ─── Image Manager (Upload + URL + Gallery) ────────────────────────────────────

function ImageManager({ productId, onAdded }: { productId: string; onAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(''); // Selected color for images
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing images for this product
  const { data: product, refetch: refetchProduct } = api.product.getById.useQuery(productId);
  const existingImages = product?.images ?? [];

  // Group images by color tag for better organization
  const imagesByColor = existingImages.reduce((acc, img) => {
    const color = img.colorTag || 'General';
    if (!acc[color]) acc[color] = [];
    acc[color].push(img);
    return acc;
  }, {} as Record<string, typeof existingImages>);

  const addImage = api.product.addImage.useMutation({
    onSuccess: () => { setUrl(''); void refetchProduct(); onAdded(); toast.success('Image added'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteImage = api.product.deleteImage.useMutation({
    onSuccess: () => { void refetchProduct(); onAdded(); toast.success('Image removed'); },
    onError: (e) => toast.error(e.message),
  });

  const uploadFiles = useCallback(async (files: File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const maxSize = 4.5 * 1024 * 1024;

    const validFiles = files.filter(f => {
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name}: Invalid type. Use JPEG, PNG, WebP, or AVIF.`);
        return false;
      }
      if (f.size > maxSize) {
        toast.error(`${f.name}: File too large (max 4.5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) {
          toast.error(`${file.name}: ${data.error}`);
          continue;
        }

        // Add to product via tRPC
        await addImage.mutateAsync({
          productId,
          url: data.url,
          isPrimary: isPrimary && successCount === 0,
          sortOrder: 0,
          colorTag: selectedColor || undefined, // Associate with selected color
        });
        successCount++;
      } catch {
        toast.error(`${file.name}: Upload failed`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} image${successCount > 1 ? 's' : ''} uploaded!`);
      void refetchProduct();
      onAdded();
    }

    setPreviews([]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [productId, isPrimary, addImage, onAdded, refetchProduct]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPreviews(files.map(f => ({ file: f, preview: URL.createObjectURL(f) })));
      void uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setPreviews(files.map(f => ({ file: f, preview: URL.createObjectURL(f) })));
      void uploadFiles(files);
    }
  }, [uploadFiles]);

  return (
    <div className="space-y-4">
      {/* Existing Images Gallery - Grouped by Color */}
      {existingImages.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs text-zinc-400 font-medium">Current Images ({existingImages.length})</label>
          {Object.entries(imagesByColor).map(([colorLabel, images]) => (
            <div key={colorLabel} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{colorLabel}</span>
                {colorLabel !== 'General' && (
                  <div
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{
                      backgroundColor:
                        product?.variants?.find((v) => v.color === colorLabel)?.colorHex ||
                        loadStoredColors().find((c) => c.name.toLowerCase() === colorLabel.toLowerCase())?.hex ||
                        '#666666',
                    }}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square">
                    <ValidatedImage src={img.url} alt={img.altText ?? 'Product image'} />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold">PRIMARY</span>
                    )}
                    <button
                      onClick={() => deleteImage.mutate(img.id)}
                      disabled={deleteImage.isPending}
                      className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-200
          ${dragActive
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          title="Upload product images"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            <p className="text-sm text-amber-400">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white font-medium">Click to upload or drag & drop</p>
              <p className="text-xs text-zinc-500 mt-1">JPEG, PNG, WebP, AVIF — Max 4.5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 relative">
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Color Selection (Variant Images) */}
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">Assign to Color (Optional)</Label>
        <div className="flex flex-wrap gap-2">
          {product?.variants
            ? [...new Map(product.variants.filter((v) => v.color).map((v) => [v.color, v])).values()].map((v) => (
                <button
                  key={v.color}
                  type="button"
                  title={v.color}
                  onClick={() => setSelectedColor(selectedColor === v.color ? '' : v.color)}
                  style={{ backgroundColor: v.colorHex || '#666666' }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all cursor-pointer ${
                    selectedColor === v.color
                      ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-1 ring-offset-zinc-950 scale-105'
                      : 'border-white/20 hover:scale-110'
                  }`}
                />
              ))
            : null}
        </div>
        {selectedColor && <p className="text-xs text-amber-400">Images will show when customers select {selectedColor}</p>}
      </div>

      {/* Primary checkbox */}
      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="accent-amber-500" />
        Set as primary image
      </label>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-zinc-600">or add by URL</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* URL Input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input placeholder="https://example.com/image.jpg" value={url}
            onChange={(e) => setUrl(e.target.value)} className="bg-zinc-800 border-white/10" />
        </div>
        <Button size="sm" onClick={() => addImage.mutate({ productId, url, isPrimary, sortOrder: 0 })}
          disabled={!url || addImage.isPending}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}


// ─── Stat Card ────────────────────────────────────────────────────────────────
function ProductStatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number | string; accent: string;
}) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [styleFilter, setStyleFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [colorFilter, setColorFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const utils = api.useUtils();

  // Fetch filter options
  const { data: brands } = api.product.getBrands.useQuery(undefined, { staleTime: 60000 });
  const { data: colors } = api.product.getColors.useQuery(undefined, { staleTime: 60000 });

  const { data, isLoading } = api.product.adminList.useQuery({
    page, pageSize,
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter as 'MEN' | 'WOMEN' | 'KIDS' : undefined,
    style: styleFilter !== 'ALL' ? styleFilter as any : undefined,
    brand: brandFilter !== 'ALL' ? brandFilter : undefined,
    color: colorFilter !== 'ALL' ? colorFilter : undefined,
    sortBy: sortBy as any,
  });

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, featured: 0, onSale: 0 };
    const items = data.items;
    return {
      total: data.total,
      active: items.filter(p => p.isActive).length,
      featured: items.filter(p => p.isFeatured).length,
      onSale: items.filter(p => p.salePrice).length,
    };
  }, [data]);

  const createMutation = api.product.create.useMutation({
    onSuccess: () => {
      toast.success('Product created!');
      setShowForm(false);
      void utils.product.adminList.invalidate();
      void utils.product.getColors.invalidate();
      void utils.product.getBrands.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated!');
      setShowForm(false);
      setEditId(null);
      void utils.product.adminList.invalidate();
      void utils.product.getById.invalidate();
      void utils.product.getColors.invalidate();
      void utils.product.getBrands.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = api.product.toggleActive.useMutation({
    onSuccess: () => { toast.success('Product status updated.'); void utils.product.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      brand: 'Executive', category: 'MEN', style: 'SPORTS', leatherType: 'CALF_SKIN',
      isFeatured: false, occasion: [], selectedSizes: [], selectedColors: [], images: [],
    },
  });

  const selectedSizes = form.watch('selectedSizes') ?? [];
  const selectedColors = form.watch('selectedColors') ?? [];
  const selectedOccasions = form.watch('occasion') ?? [];
  const category = form.watch('category');

  // Dynamic colors list with localStorage persistence and DB merge
  const [colorsList, setColorsList] = useState<ColorOption[]>(DEFAULT_PRODUCT_COLORS);

  // Load saved colors on mount
  useEffect(() => {
    const saved = loadStoredColors();
    if (saved && saved.length > 0) {
      setColorsList(saved);
    }
  }, []);



  function toggleArr(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function generateVariants() {
    const article = form.getValues('articleNumber')?.trim() || 'ART';
    const skuSet = new Set<string>();

    return selectedColors.flatMap((color) => {
      const colorCode = color.substring(0, 3).toUpperCase();
      return selectedSizes.map((ukSize) => {
        const chart = sizeChart[ukSize] ?? { us: '', eu: '', cm: '' };
        const colorHex = colorsList.find((c) => c.name.toLowerCase() === color.trim().toLowerCase())?.hex ?? '#000000';
        
        let sizeCode = chart.eu || ukSize.replace(/[^a-zA-Z0-9]/g, '');
        let baseSku = `${article}-${colorCode}-${sizeCode}-STD`;

        if (skuSet.has(baseSku)) {
          sizeCode = ukSize.replace(/[^a-zA-Z0-9]/g, '');
          baseSku = `${article}-${colorCode}-${sizeCode}-STD`;
        }

        let counter = 1;
        let finalSku = baseSku;
        while (skuSet.has(finalSku)) {
          finalSku = `${article}-${colorCode}-${sizeCode}-V${counter}-STD`;
          counter++;
        }
        skuSet.add(finalSku);

        return {
          sku: finalSku,
          sizeUK: ukSize,
          sizeUS: chart.us,
          sizeEU: chart.eu,
          sizeCM: chart.cm,
          color,
          colorHex,
          width: 'STANDARD' as const,
          priceDelta: 0,
        };
      });
    });
  }

  function onSubmit(values: FormValues) {
    const variants = generateVariants();
    const payload = {
      articleNumber: values.articleNumber,
      name: values.name, slug: values.slug, description: values.description,
      basePrice: values.basePrice, salePrice: values.salePrice,
      category: values.category, style: values.style, leatherType: values.leatherType,
      occasion: values.occasion as (typeof OCCASIONS[number])[],
      manufacturingCity: values.manufacturingCity, isFeatured: values.isFeatured,
      variants,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ─── Open Edit Form ─────────────────────────────────────────────────────────
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  async function openEditForm(productId: string) {
    setLoadingEditId(productId);
    try {
      await utils.product.getById.invalidate(productId);
      const product = await utils.product.getById.fetch(productId);
      if (!product) { toast.error('Product not found'); return; }

      // Collect unique sizes and colors from active variants
      const activeVars = product.variants.filter((v) => v.isActive);
      const sizes = [...new Set(activeVars.map((v) => v.sizeUK))];

      // Ensure any variant colors from this product are present in colorsList
      const newColorsToAdd: ColorOption[] = [];
      for (const v of activeVars) {
        if (!v.color) continue;
        const trimmed = v.color.trim();
        const exists = colorsList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
        const alreadyPending = newColorsToAdd.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
        if (!exists && !alreadyPending) {
          newColorsToAdd.push({
            name: trimmed,
            hex: v.colorHex || '#808080',
            bgClass: `bg-[${v.colorHex || '#808080'}]`,
            isCustom: true,
          });
        }
      }

      const activeColorsList = newColorsToAdd.length > 0 ? [...colorsList, ...newColorsToAdd] : colorsList;
      if (newColorsToAdd.length > 0) {
        setColorsList(activeColorsList);
        saveStoredColors(activeColorsList);
      }

      const colors = [
        ...new Set(
          activeVars.map((v) => {
            const match = activeColorsList.find((c) => c.name.toLowerCase() === v.color.trim().toLowerCase());
            return match ? match.name : v.color.trim();
          })
        ),
      ];

      const detectedBrand = knownBrands.find((b) => product.name.toLowerCase().startsWith(b.toLowerCase())) || 'Executive';

      form.reset({
        articleNumber: product.articleNumber,
        brand: detectedBrand,
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: Number(product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
        category: product.category as typeof CATEGORIES[number],
        style: product.style as typeof STYLES[number],
        leatherType: product.leatherType as typeof LEATHER_TYPES[number],
        occasion: product.occasion as string[],
        manufacturingCity: product.manufacturingCity,
        isFeatured: product.isFeatured,
        selectedSizes: sizes,
        selectedColors: colors,
        images: product.images.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
      });
      setEditId(productId);
      setShowForm(true);
    } catch (e) {
      toast.error('Failed to load product for editing');
    } finally {
      setLoadingEditId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-xl font-bold text-white">Products</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} total products</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline" size="sm"
            onClick={() => void utils.product.adminList.invalidate()}
            className="border-white/10 bg-transparent text-zinc-400 hover:text-white text-xs flex-shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => { form.reset({ brand: 'Executive', category: 'MEN', style: 'SPORTS', leatherType: 'CALF_SKIN', isFeatured: false, occasion: [], selectedSizes: [], selectedColors: [], images: [] }); setEditId(null); setShowForm(true); }}
            className="bg-amber-500 hover:bg-amber-600 text-black text-sm flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ProductStatCard icon={Package} label="Total Products" value={stats.total} accent="bg-blue-500/20 text-blue-400" />
        <ProductStatCard icon={Eye} label="Active" value={stats.active} accent="bg-green-500/20 text-green-400" />
        <ProductStatCard icon={Star} label="Featured" value={stats.featured} accent="bg-amber-500/20 text-amber-400" />
        <ProductStatCard icon={Tag} label="On Sale" value={stats.onSale} accent="bg-purple-500/20 text-purple-400" />
      </div>

      {/* Google Merchant Center Integration Panel */}
      <GMCSyncPanel />

      {/* Category Tabs + Search + Filter Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5 w-fit">
            {['ALL', ...CATEGORIES].map((cat) => (
              <Button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search by name, article # or description…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-zinc-900 border-white/10 text-white" />
            {searchInput && (
              <Button onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/10 bg-transparent text-xs flex-shrink-0 gap-1.5 ${showFilters ? 'text-amber-400 border-amber-500/30' : 'text-zinc-400 hover:text-white'}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {(styleFilter !== 'ALL' || brandFilter !== 'ALL' || colorFilter !== 'ALL') && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </Button>
        </div>

        {/* Advanced Filters Row */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 bg-zinc-900/50 border border-white/5 rounded-xl animate-in slide-in-from-top-2 duration-200">
            {/* Style Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Type / Style</label>
              <Select value={styleFilter} onValueChange={(v) => { setStyleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-8 bg-zinc-800 border-white/10 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="ALL" className="text-white text-xs">All Styles</SelectItem>
                  {(categoryFilter !== 'ALL' ? getStylesForCategory(categoryFilter) : getStylesForCategory(null)).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Brand</label>
              <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-8 bg-zinc-800 border-white/10 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                  <SelectItem value="ALL" className="text-white text-xs">All Brands</SelectItem>
                  {brands?.map((b) => (
                    <SelectItem key={b} value={b} className="text-white text-xs">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Color</label>
              <Select value={colorFilter} onValueChange={(v) => { setColorFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-8 bg-zinc-800 border-white/10 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                  <SelectItem value="ALL" className="text-white text-xs">All Colors</SelectItem>
                  {colors?.map((c) => (
                    <SelectItem key={c.color} value={c.color} className="text-white text-xs">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                          style={{
                            backgroundColor:
                              c.colorHex ||
                              colorsList.find((col) => col.name.toLowerCase() === c.color.toLowerCase())?.hex ||
                              '#888888',
                          }}
                        />
                        {c.color}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] h-8 bg-zinc-800 border-white/10 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="newest" className="text-white text-xs">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-white text-xs">Oldest First</SelectItem>
                  <SelectItem value="name-asc" className="text-white text-xs">Name A→Z</SelectItem>
                  <SelectItem value="name-desc" className="text-white text-xs">Name Z→A</SelectItem>
                  <SelectItem value="price-asc" className="text-white text-xs">Price Low→High</SelectItem>
                  <SelectItem value="price-desc" className="text-white text-xs">Price High→Low</SelectItem>
                  <SelectItem value="article-asc" className="text-white text-xs">Article # A→Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Per page */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Per Page</label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[80px] h-8 bg-zinc-800 border-white/10 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {[10, 25, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-white text-xs">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear All Filters */}
            {(styleFilter !== 'ALL' || brandFilter !== 'ALL' || colorFilter !== 'ALL' || sortBy !== 'newest') && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm"
                  onClick={() => { setStyleFilter('ALL'); setBrandFilter('ALL'); setColorFilter('ALL'); setSortBy('newest'); setPage(1); }}
                  className="h-8 text-xs text-red-400 hover:text-red-300">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table - Responsive Card View on Mobile */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-center px-2 py-3 w-12">#</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Loading…</td></tr>
              )}
              {data?.items.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-2 py-3 text-center">
                    <span className="text-[10px] text-zinc-600 font-mono">{(page - 1) * pageSize + idx + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                        {p.images[0] ? (
                          <ValidatedImage src={p.images[0].url} alt={p.name} />
                        ) : (
                          <Package className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white text-xs truncate max-w-[200px]">{p.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {p.articleNumber}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Layers className="h-3 w-3 text-zinc-600" />
                          <span className="text-xs text-zinc-600">{p._count.variants} variants · {p._count.reviews ?? 0} reviews</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">{p.category}</Badge>
                    <div className="text-xs text-zinc-600 mt-1">{getStyleLabel(p.style)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs font-medium text-amber-400">
                      PKR {Number(p.salePrice ?? p.basePrice).toLocaleString('en-PK')}
                    </div>
                    {p.salePrice && (
                      <div className="text-xs text-zinc-600 line-through">
                        PKR {Number(p.basePrice).toLocaleString('en-PK')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {p.isFeatured && <Badge className="text-xs bg-amber-500/15 text-amber-400 border-0">★ Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"
                        onClick={() => openEditForm(p.id)} title="Edit product"
                        disabled={loadingEditId === p.id}
                        className="h-9 w-9 p-0 text-zinc-400 hover:text-blue-400">
                        {loadingEditId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowImageDialog(p.id)} title="Manage images"
                        className="h-9 w-9 p-0 text-zinc-400 hover:text-amber-400">
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActiveMutation.mutate(p.id)}
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                        className="h-9 w-9 p-0 text-zinc-400 hover:text-red-400">
                        {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden">
          {isLoading && (
            <div className="text-center py-10 text-zinc-500">Loading…</div>
          )}
          <div className="space-y-3 p-4">
            {data?.items.map((p) => (
              <div key={p.id} className={`bg-zinc-800/50 border border-white/5 rounded-lg p-4 space-y-3 ${!p.isActive ? 'opacity-50' : ''}`}>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                    {p.images[0] ? (
                      <ValidatedImage src={p.images[0].url} alt={p.name} />
                    ) : (
                      <Package className="h-6 w-6 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.articleNumber}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">{p.category}</Badge>
                      <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">{getStyleLabel(p.style)}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <div className="text-sm font-medium text-amber-400">
                      PKR {Number(p.salePrice ?? p.basePrice).toLocaleString('en-PK')}
                    </div>
                    {p.salePrice && (
                      <div className="text-xs text-zinc-600 line-through">
                        PKR {Number(p.basePrice).toLocaleString('en-PK')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {p.isFeatured && <Badge className="text-xs bg-amber-500/15 text-amber-400 border-0">★ Featured</Badge>}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <Button variant="outline" size="sm"
                    onClick={() => openEditForm(p.id)}
                    disabled={loadingEditId === p.id}
                    className="flex-1 h-9 text-xs border-white/10 text-zinc-400">
                    {loadingEditId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4 mr-1" />}
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowImageDialog(p.id)}
                    className="flex-1 h-9 text-xs border-white/10 text-zinc-400">
                    <ImagePlus className="h-4 w-4 mr-1" />
                    Images
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActiveMutation.mutate(p.id)}
                    className="h-9 w-9 p-0 border-white/10 text-zinc-400">
                    {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Layers className="h-3 w-3" />
                  <span>{p._count.variants} variants · {p._count.reviews ?? 0} reviews</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Pagination */}
        {data && data.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-white/5 gap-3">
            <span className="text-xs text-zinc-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of {data.total} products
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-8 w-8 p-0" title="First page">
                «
              </Button>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-8 w-8 p-0">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
                let pageNum: number;
                if (data.totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= data.totalPages - 3) {
                  pageNum = data.totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded text-xs font-medium transition-all ${pageNum === page
                      ? 'bg-amber-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}>
                    {pageNum}
                  </button>
                );
              })}
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-8 w-8 p-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(data.totalPages)}
                className="text-xs border-white/10 bg-transparent text-zinc-400 h-8 w-8 p-0" title="Last page">
                »
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 border-white/10 text-white overflow-y-auto p-4 sm:p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">{editId ? 'Edit Product' : 'Add New Product'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Product Name *</Label>
                <Input {...form.register('name', { onChange: (e) => { if (!editId) form.setValue('slug', toSlug(e.target.value)); } })}
                  className="bg-zinc-900 border-white/10 h-10" placeholder="e.g. Executive Peshawari – Calf Skin" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Article Number *</Label>
                  <Input {...form.register('articleNumber')} className="bg-zinc-900 border-white/10 h-10" placeholder="EM-GP-001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">URL Slug *</Label>
                  <Input {...form.register('slug')} className="bg-zinc-900 border-white/10 h-10" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Description *</Label>
              <textarea {...form.register('description')}
                className="w-full h-24 px-3 py-2 text-sm bg-zinc-900 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-amber-500/50"
                placeholder="Product description…" />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Base Price (PKR) *</Label>
                <Input {...form.register('basePrice')} type="number" className="bg-zinc-900 border-white/10 h-10" placeholder="8000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Sale Price (PKR)</Label>
                <Input {...form.register('salePrice')} type="number" className="bg-zinc-900 border-white/10 h-10" placeholder="Optional" />
              </div>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 capitalize">Brand *</Label>
                <Select
                  onValueChange={(v) => {
                    form.setValue('brand', v);
                    const currentName = form.getValues('name') || '';
                    const existingBrand = knownBrands.find((b) => currentName.toLowerCase().startsWith(b.toLowerCase()));
                    let newName = currentName;
                    if (existingBrand) {
                      const rest = currentName.substring(existingBrand.length).trim();
                      newName = rest ? `${v} ${rest}` : v;
                    } else if (currentName) {
                      newName = `${v} ${currentName}`;
                    } else {
                      newName = v;
                    }
                    form.setValue('name', newName);
                    if (!editId) form.setValue('slug', toSlug(newName));
                  }}
                  value={form.watch('brand')}
                >
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 max-h-60 overflow-y-auto">
                    {knownBrands.map((b) => (
                      <SelectItem key={b} value={b} className="text-white text-xs">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 capitalize">Category</Label>
                <Select
                  onValueChange={(v) => {
                    form.setValue('category', v as any);
                    const validStyles = getStylesForCategory(v).map((s) => s.id);
                    if (!validStyles.includes(form.getValues('style'))) {
                      form.setValue('style', validStyles[0] as any);
                    }
                  }}
                  value={form.watch('category')}
                >
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {CATEGORIES.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-white text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 capitalize">Style</Label>
                <Select
                  onValueChange={(v) => form.setValue('style', v as any)}
                  value={form.watch('style')}
                >
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {getStylesForCategory(form.watch('category')).map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-white text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 capitalize">Leather Type</Label>
                <Select
                  onValueChange={(v) => form.setValue('leatherType', v as any)}
                  value={form.watch('leatherType')}
                >
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {LEATHER_TYPES.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-white text-xs">{opt.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Occasion */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Occasion *</Label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occ) => (
                  <button key={occ} type="button"
                    onClick={() => toggleArr(selectedOccasions, occ, (v) => form.setValue('occasion', v))}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedOccasions.includes(occ) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* City & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Manufacturing City *</Label>
                <Input {...form.register('manufacturingCity')} className="bg-zinc-900 border-white/10 h-10" placeholder="Pasrur" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" {...form.register('isFeatured')} id="featured" className="accent-amber-500 w-4 h-4" />
                <Label htmlFor="featured" className="text-xs text-zinc-400 cursor-pointer">Featured product</Label>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <Label className="text-xs text-zinc-400">Sizes to Generate * ({category} sizes)</Label>

              {category === 'MEN' && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">UK Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_MEN_UK.map((sz) => (
                        <button key={sz} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">English / EU Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_MEN_EU.map((sz) => (
                        <button key={sz} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {category === 'WOMEN' && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">UK Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_WOMEN_UK.map((sz) => (
                        <button key={sz} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">English / EU Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_WOMEN_EU.map((sz) => (
                        <button key={sz} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {category === 'KIDS' && (
                <>
                  {/* Youth (11-15 yrs) */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">1. Youth (11–15 yrs) — UK Sizes (2–6)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_YOUTH_UK.map((sz) => (
                        <button key={`youth-uk-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          UK {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">1. Youth (11–15 yrs) — Youth English / EU Sizes (35–39)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_YOUTH_EU.map((sz) => (
                        <button key={`youth-eu-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          EU {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Girls (7-11 yrs) */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider">2. Girls (7–11 yrs) — UK Sizes (9–2)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_GIRLS_UK.map((sz) => (
                        <button key={`girls-uk-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          UK {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider">2. Girls (7–11 yrs) — Girls English / EU Sizes (28–34)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_GIRLS_EU.map((sz) => (
                        <button key={`girls-eu-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          EU {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Boys (7-11 yrs) */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">3. Boys (7–11 yrs) — UK Sizes (9–1)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_BOYS_UK.map((sz) => (
                        <button key={`boys-uk-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          UK {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">3. Boys (7–11 yrs) — Boys English / EU Sizes (27–33)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_BOYS_EU.map((sz) => (
                        <button key={`boys-eu-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          EU {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Children (2-6 yrs) */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">4. Children (2–6 yrs) — UK Sizes (1–6)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_CHILDREN_UK.map((sz) => (
                        <button key={`children-uk-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          UK {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">4. Children (2–6 yrs) — English / EU Sizes (21–26)</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES_KIDS_CHILDREN_EU.map((sz) => (
                        <button key={`children-eu-${sz}`} type="button"
                          onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                          className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                          EU {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {category === 'ACCESSORIES' && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Accessory Standard Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {['Free Size', 'Standard'].map((sz) => (
                      <button key={sz} type="button"
                        onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                        className={`h-10 px-3 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSizes.length > 0 && <p className="text-xs text-zinc-600">{selectedSizes.length} sizes × {selectedColors.length} colors = {selectedSizes.length * selectedColors.length} variants</p>}
            </div>

            {/* Colors */}
            <ProductColorSelector
              selectedColors={selectedColors}
              onChange={(newColors) =>
                form.setValue('selectedColors', newColors, { shouldValidate: true })
              }
              colorsList={colorsList}
              onColorsListChange={(newList) => {
                setColorsList(newList);
                saveStoredColors(newList);
              }}
            />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                className="flex-1 border-white/10 text-zinc-400 bg-transparent h-10">Cancel</Button>
              <Button type="submit" disabled={isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black h-10 font-medium">
                {isPending ? 'Saving…' : editId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Image Management Dialog */}
      <Dialog open={!!showImageDialog} onOpenChange={() => setShowImageDialog(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Manage Product Images</DialogTitle>
          </DialogHeader>
          {showImageDialog && (
            <ImageManager productId={showImageDialog} onAdded={() => void utils.product.adminList.invalidate()} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(null)} className="border-white/10 text-zinc-400 bg-transparent">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
