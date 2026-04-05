'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
// Loyalty data will be fetched from tRPC customer.getLoyalty once integrated
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star,
  Gift,
  TrendingUp,
  Award,
  ShoppingBag,
  Info,
} from 'lucide-react';

const tierBenefits = {
  BRONZE: {
    color: 'bg-amber-700',
    textColor: 'text-amber-700',
    benefits: ['Earn 1 point per PKR 100 spent', 'Birthday bonus points', 'Early sale access'],
    pointsRequired: 0,
  },
  SILVER: {
    color: 'bg-slate-400',
    textColor: 'text-slate-500',
    benefits: ['Earn 1.5 points per PKR 100 spent', 'Free standard shipping', 'Exclusive member sales', 'Birthday bonus points'],
    pointsRequired: 2000,
  },
  GOLD: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    benefits: ['Earn 2 points per PKR 100 spent', 'Free express shipping', 'Priority customer support', 'Early access to new arrivals', 'Birthday bonus points'],
    pointsRequired: 5000,
  },
  PLATINUM: {
    color: 'bg-slate-800',
    textColor: 'text-slate-800',
    benefits: ['Earn 3 points per PKR 100 spent', 'Free express shipping', 'Dedicated concierge', 'Exclusive events access', 'Birthday bonus points', 'Complimentary shoe care'],
    pointsRequired: 10000,
  },
};

const allTiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;

export default function LoyaltyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    router.push('/login?redirect=/account/loyalty');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const loyalty = { tier: 'BRONZE' as const, nextTier: 'SILVER' as const, points: 0, lifetimePoints: 0, pointsToNextTier: 2000, tierExpiresAt: null as Date | null, transactions: [] as {id:string;type:string;description:string;points:number;date:Date}[] };
  const currentTierInfo = tierBenefits[loyalty.tier];
  const nextTierInfo = loyalty.nextTier ? tierBenefits[loyalty.nextTier] : null;
  const currentTierIndex = allTiers.indexOf(loyalty.tier);
  
  // Calculate progress to next tier
  const currentTierPoints = tierBenefits[loyalty.tier].pointsRequired;
  const nextTierPoints = nextTierInfo?.pointsRequired || currentTierPoints;
  const progressToNext = nextTierInfo 
    ? ((loyalty.lifetimePoints - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>
          <h1 className="text-3xl font-serif font-bold">Loyalty Program</h1>
          <p className="text-muted-foreground mt-1">Earn points and unlock exclusive rewards</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Card */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              {/* Current Tier */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`h-20 w-20 rounded-full ${currentTierInfo.color} flex items-center justify-center`}>
                  <Award className="h-10 w-10 text-white" />
                </div>
                <div>
                  <Badge className={currentTierInfo.color + ' text-white mb-1'}>
                    {loyalty.tier} Member
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Member since {loyalty.tierExpiresAt?.toLocaleDateString('en-PK', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>

              {/* Points Balance */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Available Points</span>
                  </div>
                  <p className="text-3xl font-bold">{loyalty.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Worth PKR {(loyalty.points / 2).toLocaleString()} in discounts
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Lifetime Points</span>
                  </div>
                  <p className="text-3xl font-bold">{loyalty.lifetimePoints.toLocaleString()}</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {nextTierInfo && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress to {loyalty.nextTier}</span>
                    <span className="text-sm text-muted-foreground">
                      {loyalty.pointsToNextTier.toLocaleString()} points to go
                    </span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{loyalty.lifetimePoints.toLocaleString()} pts</span>
                    <span>{nextTierPoints.toLocaleString()} pts</span>
                  </div>
                </div>
              )}

              {/* Tier Benefits */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Your {loyalty.tier} Benefits</h3>
                <ul className="space-y-2">
                  {currentTierInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Side Info */}
          <div className="space-y-6">
            {/* Tiers Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Membership Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allTiers.map((tier, index) => {
                  const tierInfo = tierBenefits[tier];
                  const isCurrentTier = tier === loyalty.tier;
                  const isUnlocked = index <= currentTierIndex;

                  return (
                    <div 
                      key={tier} 
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isCurrentTier ? 'bg-primary/10 border border-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full ${tierInfo.color} flex items-center justify-center`}>
                          {isUnlocked ? (
                            <Award className="h-3 w-3 text-white" />
                          ) : (
                            <span className="text-xs text-white">{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isCurrentTier ? tierInfo.textColor : ''}`}>
                          {tier}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tierInfo.pointsRequired.toLocaleString()} pts
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Redeem Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How to Redeem
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>Every 2 points = PKR 1 discount</p>
                <p>Minimum 500 points to redeem</p>
                <p>Points can be applied at checkout</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Points History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loyalty.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'REDEEMED' 
                        ? 'bg-orange-100 text-orange-600' 
                        : transaction.type === 'BONUS'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {transaction.type === 'REDEEMED' ? (
                        <Gift className="h-5 w-5" />
                      ) : transaction.type === 'BONUS' ? (
                        <Star className="h-5 w-5" />
                      ) : (
                        <ShoppingBag className="h-5 w-5" />
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
                      transaction.type === 'REDEEMED' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'REDEEMED' ? '-' : '+'}{transaction.points.toLocaleString()} pts
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.type === 'EARNED' ? 'Purchase' : transaction.type === 'BONUS' ? 'Bonus' : 'Redeemed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Earn More CTA */}
        <Card className="mt-6">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Earn more points with every purchase</p>
                <p className="text-sm text-muted-foreground">
                  As a {loyalty.tier} member, you earn {loyalty.tier === 'BRONZE' ? '1' : loyalty.tier === 'SILVER' ? '1.5' : loyalty.tier === 'GOLD' ? '2' : '3'} points per PKR 100 spent
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/shop">Shop Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
