'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/utils/catalog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StoreCreditsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    router.push('/login?redirect=/account/credits');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const credits = { balance: 0, lifetimeEarned: 0, lifetimeUsed: 0, transactions: [] as { id: string; type: string; amount: number; description: string; date: Date }[] };


  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>
          <h1 className="text-3xl font-serif font-bold">Store Credits</h1>
          <p className="text-muted-foreground mt-1">View and manage your store credit balance</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-4xl font-bold">{formatPrice(credits.balance)}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Lifetime Earned</span>
                  </div>
                  <p className="text-xl font-semibold text-green-600">{formatPrice(credits.lifetimeEarned)}</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-muted-foreground">Lifetime Used</span>
                  </div>
                  <p className="text-xl font-semibold text-orange-600">{formatPrice(credits.lifetimeUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Earn Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Store credits can be earned through:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Return refunds</li>
                <li>Promotional campaigns</li>
                <li>Referral bonuses</li>
                <li>Birthday rewards</li>
              </ul>
              <p className="text-muted-foreground">
                Credits are automatically applied at checkout when you have a balance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {credits.transactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {credits.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'EARNED' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {transaction.type === 'EARNED' ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.date.toLocaleDateString('en-PK', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'EARNED' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {transaction.type === 'EARNED' ? '+' : '-'}{formatPrice(transaction.amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.type === 'EARNED' ? 'Earned' : 'Used'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Use Credits CTA */}
        {credits.balance > 0 && (
          <Card className="mt-6">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Ready to use your credits?</p>
                  <p className="text-sm text-muted-foreground">
                    Your {formatPrice(credits.balance)} balance will be applied at checkout
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/shop">Shop Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
