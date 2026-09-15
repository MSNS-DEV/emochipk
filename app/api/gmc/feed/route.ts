import { NextResponse } from "next/server";
import { generateGoogleShoppingXmlFeed } from "@/lib/gmc-feed";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmc/feed
 * Returns valid Google Shopping RSS 2.0 XML product feed for Google Merchant Center.
 */
export async function GET() {
  try {
    const xml = await generateGoogleShoppingXmlFeed();

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    console.error("[GMC Feed Route] Error generating RSS feed:", err);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate Google Shopping feed</error>',
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}
