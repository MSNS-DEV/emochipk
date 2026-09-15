import { z } from "zod";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/trpc";
import { db as prisma } from "@/server/db";
import {
  getGMCConfig,
  isGMCConfigured,
  syncAllProductsToGMC,
  syncSingleProductToGMC,
  deleteVariantFromGMC,
} from "@/lib/google-merchant";

export const googleMerchantRouter = createTRPCRouter({
  /**
   * Returns current Google Merchant Center integration status & stats (Admin only)
   */
  getStatus: adminProcedure.query(async () => {
    const config = getGMCConfig();
    const isConfigured = isGMCConfigured(config);

    const [totalProducts, totalVariants, activeProductsWithImages] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({
        where: { isActive: true, product: { isActive: true } },
      }),
      prisma.product.count({
        where: { isActive: true, images: { some: {} } },
      }),
    ]);

    return {
      isConfigured,
      merchantId: config.merchantId ? `${config.merchantId.slice(0, 3)}***${config.merchantId.slice(-3)}` : null,
      clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 4)}***@${config.clientEmail.split("@")[1] || ""}` : null,
      targetCountry: config.targetCountry,
      currency: config.currency,
      feedUrl: `${config.appUrl}/api/gmc/feed`,
      totalProducts,
      totalVariants,
      readyProducts: activeProductsWithImages,
      mode: isConfigured ? ("api" as const) : ("dry-run" as const),
    };
  }),

  /**
   * Syncs all active products & variants to Google Merchant Center
   */
  syncAllProducts: adminProcedure.mutation(async () => {
    const config = getGMCConfig();
    return await syncAllProductsToGMC(config);
  }),

  /**
   * Syncs a single product by ID to Google Merchant Center
   */
  syncProduct: adminProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input }) => {
      const config = getGMCConfig();
      return await syncSingleProductToGMC(input.productId, config);
    }),

  /**
   * Deletes a variant from Google Merchant Center by offerId (SKU)
   */
  deleteVariant: adminProcedure
    .input(z.object({ offerId: z.string() }))
    .mutation(async ({ input }) => {
      const config = getGMCConfig();
      return await deleteVariantFromGMC(input.offerId, config);
    }),
});
