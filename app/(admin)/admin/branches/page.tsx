'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, MapPin, Phone, Clock, CheckCircle, XCircle, Edit, Package, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface BranchForm {
  name: string; city: string; address: string; landmark?: string;
  phone: string; managerName: string; operatingHours?: string;
}

const FIELDS: { f: keyof BranchForm; l: string; p: string; required?: boolean }[] = [
  { f: 'name', l: 'Branch Name *', p: 'Executive Mochi – Pasrur', required: true },
  { f: 'city', l: 'City *', p: 'Pasrur', required: true },
  { f: 'address', l: 'Address *', p: 'Timber Market, Pasrur', required: true },
  { f: 'landmark', l: 'Landmark', p: 'Near Service Shoes' },
  { f: 'phone', l: 'Phone *', p: '+92-310-4326201', required: true },
  { f: 'managerName', l: 'Manager Name *', p: 'Raheel Javed', required: true },
  { f: 'operatingHours', l: 'Operating Hours', p: '10AM – 9PM' },
];

export default function AdminBranchesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const utils = api.useUtils();
  const { data: branches, isLoading } = api.branch.adminList.useQuery();

  const create = api.branch.create.useMutation({
    onSuccess: () => { toast.success('Branch created'); setShowForm(false); void utils.branch.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = api.branch.update.useMutation({
    onSuccess: () => { toast.success('Branch updated'); setShowForm(false); setEditId(null); void utils.branch.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggle = api.branch.setActive.useMutation({
    onSuccess: () => { toast.success('Status updated'); void utils.branch.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BranchForm>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEdit(b: any) {
    setEditId(b.id);
    reset({
      name: b.name, city: b.city, address: b.address,
      landmark: b.landmark ?? '', phone: b.phone,
      managerName: b.managerName, operatingHours: b.operatingHours ?? '',
    });
    setShowForm(true);
  }

  function openCreate() {
    setEditId(null);
    reset({ name: '', city: '', address: '', landmark: '', phone: '', managerName: '', operatingHours: '' });
    setShowForm(true);
  }

  function onSubmit(data: BranchForm) {
    if (editId) update.mutate({ id: editId, ...data });
    else create.mutate({ ...data, isActive: true });
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Branches</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{branches?.length ?? 0} branches configured</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-black text-sm">
          <Plus className="h-4 w-4 mr-1" /> Add Branch
        </Button>
      </div>

      {/* Branch Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && (
          <div className="col-span-2 py-16 text-center text-zinc-500 text-sm">Loading branches…</div>
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {branches?.map((b: any) => (
          <div key={b.id} className={`bg-zinc-900 border rounded-xl p-5 space-y-4 transition-all ${b.isActive ? 'border-white/5' : 'border-red-500/20 opacity-70'}`}>
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{b.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{b.city}</div>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {b.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-zinc-600 mt-0.5 flex-shrink-0" />
                <span>{b.address}{b.landmark ? ` · ${b.landmark}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                <span>{b.phone}</span>
              </div>
              {b.operatingHours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-zinc-600 flex-shrink-0" />
                  <span>{b.operatingHours}</span>
                </div>
              )}
            </div>

            {/* Stats + Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-zinc-600" />
                  <span>{b._count.inventory} SKUs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-zinc-600" />
                  <span>{b._count.orders} orders</span>
                </div>
                <span>Mgr: {b.branchManager?.user.name ?? 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-zinc-400 hover:text-amber-400"
                  onClick={() => openEdit(b)}
                  title="Edit branch"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className={`h-7 w-7 p-0 ${b.isActive ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-400 hover:text-green-400'}`}
                  onClick={() => toggle.mutate({ id: b.id, isActive: !b.isActive })}
                  title={b.isActive ? 'Deactivate' : 'Activate'}
                >
                  {b.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(({ f, l, p, required }) => (
                <div key={f} className={`space-y-1.5 ${f === 'name' || f === 'address' ? 'col-span-2' : ''}`}>
                  <Label className="text-xs text-zinc-400">{l}</Label>
                  <Input
                    {...register(f, { required: required ? `${l.replace(' *', '')} is required` : false })}
                    placeholder={p}
                    className="bg-zinc-900 border-white/10"
                  />
                  {errors[f] && <p className="text-xs text-red-400">{errors[f]?.message}</p>}
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2 mt-2">
              <Button
                type="button" variant="outline"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="border-white/10 bg-transparent text-zinc-400"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-black">
                {isPending ? 'Saving…' : editId ? 'Update Branch' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
