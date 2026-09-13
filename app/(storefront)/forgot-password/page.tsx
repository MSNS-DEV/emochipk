'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }
    setSubmitted(true);
    toast.success('Password assistance instructions requested');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="h-6 w-6" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6">
          Enter your registered email address or phone number to receive account recovery instructions.
        </p>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              If an account is associated with <strong>{identifier}</strong>, our support team has been notified. You can also reach out directly via WhatsApp for instant password assistance.
            </div>

            <a
              href={`https://wa.me/923006314988?text=Hello%20Executive%20Mochi,%20I%20need%20help%20resetting%20my%20account%20password%20for%20${encodeURIComponent(identifier)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Instant Help via WhatsApp</span>
            </a>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-medium">
                Email or Phone Number
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="name@example.com or 03001234567"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold">
              Send Reset Link
            </Button>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Sign In</span>
              </Link>
              <a
                href="https://wa.me/923006314988?text=Hello%20Executive%20Mochi,%20I%20need%20password%20reset%20help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                <span>Support</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
