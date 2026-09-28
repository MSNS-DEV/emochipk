export interface CreateSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in PKR
  currency: 'PKR';
  customer: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  billingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  discountInfo?: {
    campaignId?: string;
    bankName?: string;
    discountAmount: number;
  };
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  token: string;
  redirectUrl: string;
  tracker: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderNumber?: string;
  tracker?: string;
  amount?: number;
  status?: 'CAPTURED' | 'FAILED';
  cardBin?: string;
  cardLast4?: string;
  cardScheme?: string;
}

export interface BinLookupResult {
  isEligible: boolean;
  bankName?: string;
  campaignId?: string;
  campaignName?: string;
  discountPercentage?: number;
  discountAmount: number;
  finalPayable: number;
  message?: string;
}
