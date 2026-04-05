'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF']),
});

const ROLES = ['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF', 'CUSTOMER'] as const;
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-500/15 text-purple-400',
  BRANCH_MANAGER: 'bg-blue-500/15 text-blue-400',
  WAREHOUSE_STAFF: 'bg-cyan-500/15 text-cyan-400',
  CUSTOMER: 'bg-zinc-500/15 text-zinc-400',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const utils = api.useUtils();

  const { data, isLoading } = api.user.getAll.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    role: role as 'ADMIN' | 'BRANCH_MANAGER' | 'WAREHOUSE_STAFF' | 'CUSTOMER' || undefined,
  });

  const create = api.user.create.useMutation({
    onSuccess: () => { toast.success('User created'); setShowForm(false); void utils.user.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateUser = api.user.update.useMutation({
    onSuccess: () => { toast.success('Updated'); void utils.user.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue, watch } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'BRANCH_MANAGER' as const } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data?.total ?? 0} users</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-black text-sm">
          <UserPlus className="h-4 w-4 mr-1" /> Add Staff
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-zinc-900 border-white/10 text-white" />
        </div>
        <Select onValueChange={(v) => { setRole(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-zinc-900 border-white/10 text-zinc-300">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
            <SelectItem value="ALL" className="text-white">All Roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r} className="text-white">{r.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs text-zinc-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Role</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
              <th className="text-right px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && <tr><td colSpan={4} className="text-center py-10 text-zinc-500">Loading…</td></tr>}
            {data?.items.map((u) => (
              <tr key={u.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="font-medium text-white text-xs">{u.name}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? ''}`}>
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString('en-PK')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400"
                    onClick={() => updateUser.mutate({ id: u.id, isActive: !u.isActive })}
                    title={u.isActive ? 'Deactivate' : 'Activate'}>
                    {u.isActive ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-500">Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-xs border-white/10 bg-transparent text-zinc-400">Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="text-xs border-white/10 bg-transparent text-zinc-400">Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle>Create Staff User</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-4">
            {[{ f: 'name', l: 'Full Name', p: 'Ahmed Ali' }, { f: 'email', l: 'Email', p: 'manager@executivemochi.pk' }, { f: 'password', l: 'Password', p: '••••••••', t: 'password' }, { f: 'phone', l: 'Phone', p: '+92-300-0000000' }].map(({ f, l, p, t }) => (
              <div key={f} className="space-y-1">
                <Label className="text-xs text-zinc-400">{l}</Label>
                <Input {...register(f as never)} type={t} placeholder={p} className="bg-zinc-900 border-white/10" />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Role</Label>
              <Select onValueChange={(v) => setValue('role', v as never)} defaultValue="BRANCH_MANAGER">
                <SelectTrigger className="bg-zinc-900 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {['ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF'].map((r) => (
                    <SelectItem key={r} value={r} className="text-white">{r.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending} className="bg-amber-500 hover:bg-amber-600 text-black">
                {create.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
