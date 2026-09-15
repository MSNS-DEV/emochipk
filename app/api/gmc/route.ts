import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGMCConfig, isGMCConfigured, syncAllProductsToGMC, syncSingleProductToGMC } from "@/lib/google-merchant";
import { z } from "zod";

export const dynamic = "force-dynamic";

const GMCPostSchema = z.object({
  productId: z.string().optional(),
});

/**
 * GET /api/gmc
 * Returns current Google Merchant Center integration status & configuration info.
 * Restricted to authenticated ADMIN users.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin credentials required." },
      { status: 403 }
    );
  }

  try {
    const config = getGMCConfig();
    const configured = isGMCConfigured(config);

    return NextResponse.json({
      configured,
      merchantId: config.merchantId ? `${config.merchantId.slice(0, 3)}***${config.merchantId.slice(-3)}` : null,
      clientEmail: config.clientEmail ? `${config.clientEmail.slice(0, 4)}***@${config.clientEmail.split("@")[1] || ""}` : null,
      targetCountry: config.targetCountry,
      currency: config.currency,
      feedUrl: `${config.appUrl}/api/gmc/feed`,
      mode: configured ? "API_READY" : "DRY_RUN",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve GMC status" }, { status: 500 });
  }
}

/**
 * POST /api/gmc
 * Syncs products with Google Merchant Center API.
 * Restricted to authenticated ADMIN users.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Admin credentials required." },
      { status: 403 }
    );
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = GMCPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { productId } = parsed.data;
    const config = getGMCConfig();

    if (productId) {
      const result = await syncSingleProductToGMC(productId, config);
      return NextResponse.json(result);
    }

    const result = await syncAllProductsToGMC(config);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[GMC API Route] Error during product sync:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute GMC sync" },
      { status: 500 }
    );
  }
}
