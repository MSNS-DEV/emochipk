'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, MapPin, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface BranchForm { name: string; city: string; address: string; landmark?: string; phone: string; managerName: string; operatingHours?: string; }

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
    onSuccess: () => void utils.branch.adminList.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, reset } = useForm<BranchForm>();

  function onSubmit(data: BranchForm) {
    if (editId) update.mutate({ id: editId, ...data });
    else create.mutate({ ...data, isActive: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Branches</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{branches?.length ?? 0} branches</p>
        </div>
        <Button onClick={() => { reset(); setEditId(null); setShowForm(true); }} className="bg-amber-500 hover:bg-amber-600 text-black text-sm">
          <Plus className="h-4 w-4 mr-1" /> Add Branch
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {isLoading && <div className="col-span-2 text-zinc-500 text-sm py-10 text-center">Loading…</div>}
        {branches?.map((b: any) => (
          <div key={b.id} className="bg-zinc-900 border border-white/5 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{b.name}</div>
                  <div className="text-xs text-zinc-500">{b.city}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400"
                  onClick={() => toggle.mutate({ id: b.id, isActive: !b.isActive })}>
                  {b.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 pl-13">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <MapPin className="h-3 w-3 text-zinc-600" /> {b.address}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Phone className="h-3 w-3 text-zinc-600" /> {b.phone}
              </div>
              {b.operatingHours && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Clock className="h-3 w-3 text-zinc-600" /> {b.operatingHours}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="text-xs text-zinc-500">{b._count.inventory} SKUs · {b._count.orders} orders</div>
              <div className="text-xs text-zinc-500">Manager: {b.branchManager?.user.name ?? 'Unassigned'}</div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editId ? 'Edit Branch' : 'Add Branch'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { f: 'name', l: 'Branch Name', p: 'Executive Mochi – Pasrur' },
              { f: 'city', l: 'City', p: 'Pasrur' },
              { f: 'address', l: 'Address', p: 'Timber Market, Pasrur' },
              { f: 'landmark', l: 'Landmark', p: 'Near Service Shoes' },
              { f: 'phone', l: 'Phone', p: '+92-345-8760001' },
              { f: 'managerName', l: 'Manager Name', p: 'Manager Name' },
              { f: 'operatingHours', l: 'Operating Hours', p: '10AM – 9PM' },
            ].map(({ f, l, p }) => (
              <div key={f} className="space-y-1">
                <Label className="text-xs text-zinc-400">{l}</Label>
                <Input {...register(f as keyof BranchForm)} placeholder={p} className="bg-zinc-900 border-white/10" />
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black">
                {editId ? 'Update' : 'Create'} Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
