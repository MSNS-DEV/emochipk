import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';
import { evaluateBinDiscount, getActiveBankCampaigns } from '@/lib/payment/bin-lookup';
import { SafepayService } from '@/lib/payment/safepay';

export const paymentRouter = createTRPCRouter({
  /**
   * Real-time BIN lookup endpoint for checkout card number input
   */
  lookupBin: publicProcedure
    .input(
      z.object({
        bin: z.string().min(6),
        subtotal: z.number().nonnegative(),
      })
    )
    .query(async ({ input }) => {
      return evaluateBinDiscount(input.bin, input.subtotal);
    }),

  /**
   * Returns active bank alliance discount campaigns for checkout badges / marketing display
   */
  getActiveCampaigns: publicProcedure.query(async () => {
    return getActiveBankCampaigns();
  }),

  /**
   * Initiates digital card checkout for an order and returns the 3DS checkout URL
   */
  initiateCardSession: publicProcedure
    .input(
      z.object({
        orderNumber: z.string(),
        cardBin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { orderNumber: input.orderNumber },
        include: { shippingAddress: true, user: true },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (order.paymentStatus === 'PAID_DIGITAL') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order is already marked as paid.',
        });
      }

      const addr = order.shippingAddress;
      if (!addr) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Order is missing shipping address information.',
        });
      }

      const [firstName, ...rest] = (addr.fullName || 'Customer').split(' ');
      const lastName = rest.join(' ') || 'Customer';

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        'https://executivemochi.pk';

      const returnUrl = `${appUrl}/order-success?order=${encodeURIComponent(order.orderNumber)}&payment=success`;
      const cancelUrl = `${appUrl}/checkout?order=${encodeURIComponent(order.orderNumber)}&cancelled=true`;

      // Generate checkout session with Safepay
      const session = await SafepayService.createCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        currency: 'PKR',
        customer: {
          email: order.user?.email || 'guest@executivemochi.pk',
          phone: addr.phone,
          firstName,
          lastName,
        },
        billingAddress: {
          street: addr.street,
          city: addr.city,
          province: addr.province,
          postalCode: addr.postalCode ?? undefined,
        },
        returnUrl,
        cancelUrl,
      });

      // Record transaction in database
      await ctx.db.paymentTransaction.create({
        data: {
          orderId: order.id,
          gateway: 'SAFEPAY',
          transactionReference: session.tracker,
          amount: order.totalAmount,
          status: 'INITIATED',
          cardBin: input.cardBin?.replace(/\D/g, '').slice(0, 6) || null,
        },
      });

      return {
        redirectUrl: session.redirectUrl,
        tracker: session.tracker,
      };
    }),
});
