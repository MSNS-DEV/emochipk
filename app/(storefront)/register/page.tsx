'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/trpc';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  const register = api.user.register.useMutation({
    onSuccess: async (_, vars) => {
      toast.success('Account created! Signing you in…');
      await signIn('credentials', { email: vars.email, password: vars.password, redirect: false });
      router.push('/account');
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    register.mutate({
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      phone: fd.get('phone') as string || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[#0f0d09] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-900/80 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold text-lg mb-4">EM</div>
            <h1 className="text-2xl font-serif font-bold text-white">Create Account</h1>
            <p className="text-sm text-zinc-500 mt-1">Join Executive Mochi</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Full Name *</Label>
              <Input name="name" placeholder="Ahmed Ali" required
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Email address *</Label>
              <Input name="email" type="email" placeholder="you@example.com" required
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Phone (optional)</Label>
              <Input name="phone" type="tel" placeholder="+92-300-0000000"
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Password * (min. 8 characters)</Label>
              <div className="relative">
                <Input name="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" required minLength={8}
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 h-11 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={register.isPending} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-semibold mt-2">
              {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-zinc-500">Already have an account? </span>
            <Link href="/login" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
