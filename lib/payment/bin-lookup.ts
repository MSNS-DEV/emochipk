import { db } from '@/server/db';
import type { BinLookupResult } from './types';

/**
 * Known Pakistani Bank names mapped from issuingBank codes
 */
export const PAKISTANI_BANKS: Record<string, string> = {
  HBL: 'Habib Bank Limited (HBL)',
  ALFALAH: 'Bank Alfalah',
  MEEZAN: 'Meezan Bank',
  SCB: 'Standard Chartered',
  BAHL: 'Bank AL Habib',
  MCB: 'MCB Bank',
  UBL: 'United Bank Limited',
  ABL: 'Allied Bank',
  FAYSAL: 'Faysal Bank',
};

/**
 * Validates a card BIN (first 6 digits) against active bank discount campaigns in the DB.
 */
export async function evaluateBinDiscount(bin: string, subtotal: number): Promise<BinLookupResult> {
  const cleanBin = bin.replace(/\D/g, '').slice(0, 6);
  if (cleanBin.length < 6) {
    return { isEligible: false, discountAmount: 0, finalPayable: subtotal };
  }

  const now = new Date();
  const activeCampaigns = await db.bankDiscountCampaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      binPrefixes: { has: cleanBin },
    },
    orderBy: { discountValue: 'desc' },
  });

  if (activeCampaigns.length === 0) {
    return { isEligible: false, discountAmount: 0, finalPayable: subtotal };
  }

  const campaign = activeCampaigns[0];
  const bankDisplayName = PAKISTANI_BANKS[campaign.issuingBank] || campaign.issuingBank;

  // Check minimum order amount threshold
  if (campaign.minimumOrderAmount && subtotal < Number(campaign.minimumOrderAmount)) {
    return {
      isEligible: false,
      bankName: bankDisplayName,
      discountAmount: 0,
      finalPayable: subtotal,
      message: `Minimum order of Rs. ${Number(campaign.minimumOrderAmount).toLocaleString()} required for ${bankDisplayName} discount.`,
    };
  }

  let calculatedDiscount = 0;
  if (campaign.discountType === 'PERCENTAGE') {
    const rawDiscount = subtotal * (Number(campaign.discountValue) / 100);
    const maxCap = campaign.maxDiscountCap ? Number(campaign.maxDiscountCap) : Infinity;
    calculatedDiscount = Math.min(rawDiscount, maxCap);
  } else {
    calculatedDiscount = Number(campaign.discountValue);
  }

  calculatedDiscount = Math.round(calculatedDiscount);
  const finalPayable = Math.max(0, subtotal - calculatedDiscount);

  return {
    isEligible: true,
    campaignId: campaign.id,
    campaignName: campaign.name,
    bankName: bankDisplayName,
    discountPercentage: Number(campaign.discountValue),
    discountAmount: calculatedDiscount,
    finalPayable,
    message: `🎉 ${bankDisplayName} ${Number(campaign.discountValue)}% discount applied (-Rs. ${calculatedDiscount.toLocaleString()})!`,
  };
}

/**
 * Returns all active bank discount campaigns for checkout badges / marketing display.
 */
export async function getActiveBankCampaigns() {
  const now = new Date();
  const campaigns = await db.bankDiscountCampaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      name: true,
      issuingBank: true,
      discountType: true,
      discountValue: true,
      maxDiscountCap: true,
      minimumOrderAmount: true,
    },
    orderBy: { discountValue: 'desc' },
  });

  return campaigns.map((c) => ({
    ...c,
    discountValue: Number(c.discountValue),
    maxDiscountCap: c.maxDiscountCap ? Number(c.maxDiscountCap) : null,
    minimumOrderAmount: c.minimumOrderAmount ? Number(c.minimumOrderAmount) : null,
    bankDisplayName: PAKISTANI_BANKS[c.issuingBank] || c.issuingBank,
  }));
}
