'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', {
      email, password, redirect: false,
    });
    setLoading(false);
    if (!result?.ok) {
      toast.error(result?.error ?? 'Login failed. Please check your credentials.');
      return;
    }
    toast.success('Welcome back!');
    // Redirect based on role — we check session
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0f0d09] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold text-lg mb-4">EM</div>
            <h1 className="text-2xl font-serif font-bold text-white">Welcome Back</h1>
            <p className="text-sm text-zinc-500 mt-1">Sign in to Executive Mochi</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Email address</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@executivemochi.pk"
                required
                autoComplete="email"
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500/50 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">Password</Label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300">Forgot?</Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-500/50 h-11 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm mt-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="h-4 w-4 mr-2" /> Sign In</>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-zinc-500">Don&apos;t have an account? </span>
            <Link href="/register" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Create one</Link>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-white/3 rounded-lg border border-white/5">
            <p className="text-xs text-zinc-500 text-center mb-2">Demo credentials</p>
            <div className="text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between"><span>Admin:</span><span className="font-mono text-amber-400/80">admin@executivemochi.pk</span></div>
              <div className="flex justify-between"><span>Password:</span><span className="font-mono text-amber-400/80">Admin@12345</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
