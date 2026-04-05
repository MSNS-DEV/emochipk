'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { styleCategories } from '@/lib/utils/catalog';

const availableSizes = ['3','4','5','6','7','8','9','10','11','10K','11K','12K'];
const categories = styleCategories.map((s) => ({ id: s.id, name: s.label }));
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Ruler, Plus, Pencil, Trash2, Info } from 'lucide-react';

const widthOptions = [
  { value: 'NARROW', label: 'Narrow' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'WIDE', label: 'Wide' },
];

interface SizeMemoryItem {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  size: string;
  width: 'NARROW' | 'STANDARD' | 'WIDE';
  notes?: string;
}

export default function SizeMemoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sizeMemory, setSizeMemory] = useState<SizeMemoryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SizeMemoryItem | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    size: '',
    width: 'STANDARD' as 'NARROW' | 'STANDARD' | 'WIDE',
    notes: '',
  });

  if (!isLoading && !isAuthenticated) {
    router.push('/login?redirect=/account/sizes');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      categoryId: '',
      size: '',
      width: 'STANDARD',
      notes: '',
    });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: SizeMemoryItem) => {
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId,
      size: item.size,
      width: item.width,
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.size) {
      toast.error('Please select a category and size');
      return;
    }

    const category = categories.find(c => c.id === formData.categoryId);
    if (!category) {
      toast.error('Invalid category');
      return;
    }

    if (editingItem) {
      setSizeMemory(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData, categoryName: category.name }
          : item
      ));
      toast.success('Size preference updated');
    } else {
      // Check if category already exists
      if (sizeMemory.some(item => item.categoryId === formData.categoryId)) {
        toast.error('You already have a size saved for this category');
        return;
      }

      const newItem: SizeMemoryItem = {
        id: `sm-${Date.now()}`,
        userId: user?.id || '',
        categoryId: formData.categoryId,
        categoryName: category.name,
        size: formData.size,
        width: formData.width,
        notes: formData.notes,
      };
      setSizeMemory(prev => [...prev, newItem]);
      toast.success('Size preference saved');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const deleteItem = (itemId: string) => {
    setSizeMemory(prev => prev.filter(item => item.id !== itemId));
    toast.success('Size preference removed');
  };

  // Filter out categories that already have saved sizes (when adding)
  const availableCategories = editingItem 
    ? categories 
    : categories.filter(c => !sizeMemory.some(sm => sm.categoryId === c.id));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold">Size Memory</h1>
              <p className="text-muted-foreground mt-1">Save your preferred sizes for faster checkout</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} disabled={availableCategories.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Size
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Size Preference' : 'Save Size Preference'}
                    </DialogTitle>
                    <DialogDescription>
                      Save your preferred size for a shoe category. This will be auto-selected during checkout.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                        disabled={!!editingItem}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(editingItem ? categories : availableCategories).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="size">Size</Label>
                        <Select
                          value={formData.size}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="width">Width</Label>
                        <Select
                          value={formData.width}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, width: value as 'NARROW' | 'STANDARD' | 'WIDE' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {widthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="E.g., 'Prefer slightly roomier fit'"
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Save'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">How Size Memory Works</p>
              <p className="text-sm text-muted-foreground">
                When you browse products or checkout, your saved sizes will be automatically selected. This makes shopping faster and ensures you always get the right fit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Size Memory List */}
        {sizeMemory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Ruler className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-medium mb-2">No sizes saved</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Save your preferred sizes for different shoe categories to speed up your shopping experience.
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Size
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sizeMemory.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{item.categoryName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="text-2xl font-bold">{item.size}</p>
                    </div>
                    <Badge variant="secondary">
                      {widthOptions.find(w => w.value === item.width)?.label}
                    </Badge>
                  </div>

                  {item.notes && (
                    <p className="text-sm text-muted-foreground italic">&quot;{item.notes}&quot;</p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Size Guide Link */}
        <Card className="mt-8">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Ruler className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Not sure about your size?</p>
                <p className="text-sm text-muted-foreground">Check our size guide for accurate measurements</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/size-guide">View Size Guide</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
