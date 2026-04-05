'use client';

import { useState } from 'react';
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
  Plus, Search, Edit, Trash2, Package, Eye, EyeOff, ImagePlus, X,
} from 'lucide-react';
import { toast } from 'sonner';

const STYLES = ['LOAFERS', 'OXFORD', 'MOCCASINS', 'PESHAWARI', 'SANDALS', 'SNEAKERS'] as const;
const CATEGORIES = ['MEN', 'WOMEN', 'KIDS'] as const;
const LEATHER_TYPES = ['CALF_SKIN', 'GOAT_LEATHER', 'SUEDE', 'NUBUCK', 'PREMIUM_SYNTHETIC'] as const;
const OCCASIONS = ['ETHNIC', 'WEDDING', 'SPORTS', 'FORMAL', 'CASUAL'] as const;
const SIZES_MEN = ['6', '7', '8', '9', '10', '11'];
const SIZES_WOMEN = ['3', '4', '5', '6', '7', '8'];
const SIZES_KIDS = ['10K', '11K', '12K', '1', '2', '3'];
const COLORS = [
  { name: 'Black', hex: '#1a1a1a' }, { name: 'Brown', hex: '#8B4513' },
  { name: 'Tan', hex: '#D2B48C' }, { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#808080' }, { name: 'Navy', hex: '#1a1a3e' },
  { name: 'Gold', hex: '#CFB53B' }, { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Cognac', hex: '#9A463D' }, { name: 'Olive', hex: '#808000' },
];

const sizeChart: Record<string, { us: string; eu: string; cm: string }> = {
  '3': { us: '5.5', eu: '36', cm: '22.5' }, '4': { us: '6.5', eu: '37', cm: '23.5' },
  '5': { us: '7.5', eu: '38', cm: '24.0' }, '6': { us: '8.5', eu: '39', cm: '24.5' },
  '7': { us: '9.5', eu: '40', cm: '25.5' }, '8': { us: '10.5', eu: '41', cm: '26.0' },
  '9': { us: '10', eu: '43', cm: '27.5' }, '10': { us: '11', eu: '44', cm: '28.5' },
  '11': { us: '12', eu: '45', cm: '29.5' },
  '10K': { us: '11K', eu: '28', cm: '17.0' }, '11K': { us: '12K', eu: '29', cm: '17.5' },
  '12K': { us: '13K', eu: '30', cm: '18.5' }, '1': { us: '2', eu: '33', cm: '20.5' },
  '2': { us: '3', eu: '35', cm: '21.5' },
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Product Form Schema ──────────────────────────────────────────────────────

const FormSchema = z.object({
  articleNumber: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  description: z.string().min(10, 'At least 10 characters'),
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
  images: z.array(z.object({ url: z.string().url('Invalid URL'), isPrimary: z.boolean() })).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

// ─── Image URL Form ───────────────────────────────────────────────────────────

function ImageUrlInput({ productId, onAdded }: { productId: string; onAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const addImage = api.product.addImage.useMutation({
    onSuccess: () => { setUrl(''); onAdded(); toast.success('Image added'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Input placeholder="https://example.com/image.jpg" value={url}
          onChange={(e) => setUrl(e.target.value)} className="bg-zinc-800 border-white/10" />
      </div>
      <label className="flex items-center gap-1 text-xs text-zinc-400 whitespace-nowrap">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="accent-amber-500" />
        Primary
      </label>
      <Button size="sm" onClick={() => addImage.mutate({ productId, url, isPrimary, sortOrder: 0 })}
        disabled={!url || addImage.isPending}>
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState<string | null>(null);

  const utils = api.useUtils();
  const { data, isLoading } = api.product.adminList.useQuery({ page, pageSize: 20, search: search || undefined });

  const createMutation = api.product.create.useMutation({
    onSuccess: () => { toast.success('Product created!'); setShowForm(false); void utils.product.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.product.update.useMutation({
    onSuccess: () => { toast.success('Product updated!'); setShowForm(false); setEditId(null); void utils.product.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = api.product.delete.useMutation({
    onSuccess: () => { toast.success('Product deactivated.'); void utils.product.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: 'MEN', style: 'OXFORD', leatherType: 'CALF_SKIN',
      isFeatured: false, occasion: [], selectedSizes: [], selectedColors: [], images: [],
    },
  });

  const selectedSizes = form.watch('selectedSizes') ?? [];
  const selectedColors = form.watch('selectedColors') ?? [];
  const selectedOccasions = form.watch('occasion') ?? [];
  const category = form.watch('category');

  const sizeOptions = category === 'WOMEN' ? SIZES_WOMEN : category === 'KIDS' ? SIZES_KIDS : SIZES_MEN;

  function toggleArr(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function generateVariants() {
    const variants: FormValues['images'] = [];
    // just return structure for API
    return selectedColors.flatMap((color) =>
      selectedSizes.map((ukSize) => {
        const chart = sizeChart[ukSize] ?? { us: '', eu: '', cm: '' };
        const colorHex = COLORS.find((c) => c.name === color)?.hex ?? '#000000';
        return {
          sku: `${form.getValues('articleNumber')}-${color.substring(0, 3).toUpperCase()}-${chart.eu}-STD`,
          sizeUK: ukSize, sizeUS: chart.us, sizeEU: chart.eu, sizeCM: chart.cm,
          color, colorHex, width: 'STANDARD' as const, priceDelta: 0,
        };
      })
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} total products</p>
        </div>
        <Button onClick={() => { form.reset(); setEditId(null); setShowForm(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-black text-sm">
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input placeholder="Search by name or article number…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 bg-zinc-900 border-white/10 text-white" />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-center px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr><td colSpan={5} className="text-center py-10 text-zinc-500">Loading…</td></tr>
              )}
              {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white text-xs">{p.name}</div>
                        <div className="text-xs text-zinc-500">{p.articleNumber} · {p._count.variants} variants</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs border-white/10 text-zinc-400">{p.category}</Badge>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {p.isFeatured && <Badge className="ml-1 text-xs bg-amber-500/15 text-amber-400 border-0">Featured</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setShowImageDialog(p.id)} title="Manage images"
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-amber-400">
                        <ImagePlus className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)} title="Deactivate"
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400">
                        {p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400">Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="text-xs border-white/10 bg-transparent text-zinc-400">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-zinc-950 border-white/10 text-white overflow-y-auto p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">{editId ? 'Edit Product' : 'Add New Product'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-zinc-400">Product Name *</Label>
                <Input {...form.register('name', { onChange: (e) => { if (!editId) form.setValue('slug', toSlug(e.target.value)); } })}
                  className="bg-zinc-900 border-white/10" placeholder="e.g. Executive Peshawari – Calf Skin" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Article Number *</Label>
                <Input {...form.register('articleNumber')} className="bg-zinc-900 border-white/10" placeholder="EM-GP-001" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">URL Slug *</Label>
                <Input {...form.register('slug')} className="bg-zinc-900 border-white/10" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Description *</Label>
              <textarea {...form.register('description')}
                className="w-full h-24 px-3 py-2 text-sm bg-zinc-900 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-amber-500/50"
                placeholder="Product description…" />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Base Price (PKR) *</Label>
                <Input {...form.register('basePrice')} type="number" className="bg-zinc-900 border-white/10" placeholder="8000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Sale Price (PKR)</Label>
                <Input {...form.register('salePrice')} type="number" className="bg-zinc-900 border-white/10" placeholder="Optional" />
              </div>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-3 gap-3">
              {(['category', 'style', 'leatherType'] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs text-zinc-400 capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                  <Select onValueChange={(v) => form.setValue(field, v as never)} defaultValue={form.watch(field)}>
                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {(field === 'category' ? CATEGORIES : field === 'style' ? STYLES : LEATHER_TYPES).map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-white text-xs">{opt.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Manufacturing City *</Label>
                <Input {...form.register('manufacturingCity')} className="bg-zinc-900 border-white/10" placeholder="Pasrur" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" {...form.register('isFeatured')} id="featured" className="accent-amber-500" />
                <Label htmlFor="featured" className="text-xs text-zinc-400 cursor-pointer">Featured product</Label>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Sizes to Generate * ({category} sizes)</Label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((sz) => (
                  <button key={sz} type="button"
                    onClick={() => toggleArr(selectedSizes, sz, (v) => form.setValue('selectedSizes', v))}
                    className={`w-10 h-9 rounded-lg text-xs border transition-all ${selectedSizes.includes(sz) ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'border-white/10 text-zinc-500 hover:border-white/30'}`}>
                    {sz}
                  </button>
                ))}
              </div>
              {selectedSizes.length > 0 && <p className="text-xs text-zinc-600">{selectedSizes.length} sizes × {selectedColors.length} colors = {selectedSizes.length * selectedColors.length} variants</p>}
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Colors to Generate *</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c.name} type="button" title={c.name}
                    onClick={() => toggleArr(selectedColors, c.name, (v) => form.setValue('selectedColors', v))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColors.includes(c.name) ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-1 ring-offset-zinc-950' : 'border-white/20 hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black">
                {isPending ? 'Saving…' : editId ? 'Update Product' : 'Create Product'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                className="border-white/10 text-zinc-400 bg-transparent">Cancel</Button>
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
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">Add image URLs for this product. Admins and managers can add images here.</p>
              <ImageUrlInput productId={showImageDialog} onAdded={() => void utils.product.adminList.invalidate()} />
              <p className="text-xs text-zinc-600">Supported: direct image URLs (jpg, webp, png)</p>
            </div>
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
