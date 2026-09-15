import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Custom robots.txt route handler.
 * Next.js MetadataRoute.Robots discards non-standard directives like Content-Signal.
 * This handler emits a RFC-compliant robots.txt containing the draft-romm-aipref-contentsignals
 * directives for bot and AI crawl control.
 *
 * Directives:
 * Content-Signal: ai-train=no, search=yes, ai-input=no
 */
export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://executivemochi.pk').replace(/\/$/, '');

  const content = `# Executive Mochi robots.txt
# Signals preferences for AI actions (IETF draft-romm-aipref-contentsignals)

User-agent: *
Content-Signal: ai-train=no, search=yes, ai-input=no
Allow: /
Allow: /shop
Allow: /product/
Allow: /about
Allow: /craftsmanship
Allow: /stores
Allow: /size-guide
Allow: /contact
Allow: /faqs
Allow: /shipping
Allow: /returns
Allow: /privacy
Allow: /terms
Allow: /careers
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /api/images/
Allow: /api/gmc/feed
Disallow: /admin
Disallow: /admin/
Disallow: /branch
Disallow: /branch/
Disallow: /account
Disallow: /account/
Disallow: /checkout
Disallow: /checkout/
Disallow: /order-success
Disallow: /order-success/
Disallow: /cart
Disallow: /cart/
Disallow: /wishlist
Disallow: /wishlist/
Disallow: /api/trpc/
Disallow: /api/auth/
Disallow: /api/upload
Disallow: /api/webhooks/

# Google Search Central
User-agent: Googlebot
Allow: /
Allow: /shop
Allow: /product/
Allow: /about
Allow: /craftsmanship
Allow: /stores
Allow: /size-guide
Allow: /contact
Allow: /faqs
Allow: /shipping
Allow: /returns
Allow: /privacy
Allow: /terms
Allow: /careers
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /api/gmc/feed
Allow: /api/images/
Disallow: /admin
Disallow: /admin/
Disallow: /branch
Disallow: /branch/
Disallow: /account
Disallow: /account/
Disallow: /checkout
Disallow: /checkout/
Disallow: /order-success
Disallow: /order-success/
Disallow: /cart
Disallow: /cart/
Disallow: /wishlist
Disallow: /wishlist/
Disallow: /api/trpc/

# Bing Webmaster Tools
User-agent: Bingbot
Allow: /
Allow: /shop
Allow: /product/
Allow: /about
Allow: /craftsmanship
Allow: /stores
Allow: /size-guide
Allow: /contact
Allow: /faqs
Allow: /shipping
Allow: /returns
Allow: /privacy
Allow: /terms
Allow: /careers
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /api/gmc/feed
Allow: /api/images/
Disallow: /admin
Disallow: /admin/
Disallow: /branch
Disallow: /branch/
Disallow: /account
Disallow: /account/
Disallow: /checkout
Disallow: /checkout/
Disallow: /order-success
Disallow: /order-success/
Disallow: /cart
Disallow: /cart/
Disallow: /wishlist
Disallow: /wishlist/
Disallow: /api/trpc/

# Generative AI / LLM search bots (GEO optimization)
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: PerplexityBot
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Google-Extended
User-agent: Applebot
Content-Signal: ai-train=no, search=yes, ai-input=no
Allow: /
Allow: /shop
Allow: /product/
Allow: /about
Allow: /craftsmanship
Allow: /size-guide
Allow: /stores
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /api/images/
Disallow: /admin
Disallow: /admin/
Disallow: /branch
Disallow: /branch/
Disallow: /account
Disallow: /account/
Disallow: /checkout
Disallow: /cart
Disallow: /api/

# Image Crawlers
User-agent: Googlebot-Image
Allow: /
Allow: /api/images/
Allow: /images/
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.png
Allow: /*.webp
Allow: /*.avif
Disallow: /admin
Disallow: /admin/
Disallow: /branch
Disallow: /branch/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(content.trim() + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
