'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
// Address mock data removed — api.customer.getAddresses integration pending
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2,
  Home,
  Building2,
  Star,
} from 'lucide-react';
import type { Address } from '@/lib/types';

const pakistanProvinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Kashmir',
  'Gilgit-Baltistan',
];

const addressLabels = [
  { value: 'Home', icon: Home },
  { value: 'Office', icon: Building2 },
  { value: 'Other', icon: MapPin },
];

export default function AddressesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    label: 'Home',
  });

  if (!isLoading && !isAuthenticated) {
    router.push('/login?redirect=/account/addresses');
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
      fullName: user?.name ?? '',
      phone: '',
      streetAddress: '',
      apartment: '',
      city: '',
      province: '',
      postalCode: '',
      label: 'Home',
    });
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      streetAddress: address.streetAddress,
      apartment: address.apartment || '',
      city: address.city,
      province: address.province,
      postalCode: address.postalCode || '',
      label: address.label || 'Home',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.streetAddress || !formData.city || !formData.province) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingAddress) {
      // Update existing address
      setAddresses(prev => prev.map(a => 
        a.id === editingAddress.id 
          ? { ...a, ...formData, country: 'Pakistan' }
          : a
      ));
      toast.success('Address updated successfully');
    } else {
      // Add new address
      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        userId: user?.id,
        ...formData,
        country: 'Pakistan',
        isDefault: addresses.length === 0,
      };
      setAddresses(prev => [...prev, newAddress]);
      toast.success('Address added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const deleteAddress = (addressId: string) => {
    setAddresses(prev => prev.filter(a => a.id !== addressId));
    toast.success('Address deleted');
  };

  const setAsDefault = (addressId: string) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    })));
    toast.success('Default address updated');
  };

  const getLabelIcon = (label?: string) => {
    const found = addressLabels.find(l => l.value === label);
    return found ? found.icon : MapPin;
  };

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
              <h1 className="text-3xl font-serif font-bold">My Addresses</h1>
              <p className="text-muted-foreground mt-1">Manage your delivery addresses</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAddress 
                        ? 'Update your delivery address details.'
                        : 'Add a new delivery address to your account.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="label">Address Label</Label>
                      <Select
                        value={formData.label}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {addressLabels.map((label) => (
                            <SelectItem key={label.value} value={label.value}>
                              <div className="flex items-center gap-2">
                                <label.icon className="h-4 w-4" />
                                {label.value}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+92 300 1234567"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="streetAddress">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
                        placeholder="House/Building number, Street name"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apartment">Apartment / Suite (Optional)</Label>
                      <Input
                        id="apartment"
                        value={formData.apartment}
                        onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                        placeholder="Apartment, suite, floor, etc."
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="province">Province *</Label>
                        <Select
                          value={formData.province}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            {pakistanProvinces.map((province) => (
                              <SelectItem key={province} value={province}>
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="54000"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-medium mb-2">No addresses saved</h2>
              <p className="text-muted-foreground mb-6">Add your first delivery address</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((address) => {
              const LabelIcon = getLabelIcon(address.label);
              
              return (
                <Card key={address.id} className={address.isDefault ? 'border-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LabelIcon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{address.label || 'Address'}</CardTitle>
                      </div>
                      {address.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{address.fullName}</p>
                      <p className="text-muted-foreground">{address.streetAddress}</p>
                      {address.apartment && (
                        <p className="text-muted-foreground">{address.apartment}</p>
                      )}
                      <p className="text-muted-foreground">
                        {address.city}, {address.province} {address.postalCode}
                      </p>
                      <p className="text-muted-foreground">{address.phone}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(address)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!address.isDefault && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setAsDefault(address.id)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Set Default
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
