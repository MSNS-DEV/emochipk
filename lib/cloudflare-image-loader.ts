/**
 * Cloudflare Image Resizing Loader for Next.js Image Component.
 * 
 * Automatically transforms image URLs into Cloudflare Image Resizing URLs:
 * /cdn-cgi/image/width={width},quality={quality},format=auto,fit=scale-down,metadata=none/{source}
 * 
 * Performance & Bandwidth Benefits:
 * - format=auto: Cloudflare edge dynamically negotiates AVIF or WebP based on client browser Accept headers.
 * - fit=scale-down: Prevents upscaling of smaller assets.
 * - metadata=none: Strips EXIF camera metadata to reduce byte transfer.
 * - Edge-cached globally across 300+ Cloudflare PoPs with zero server compute overhead.
 */

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If SVG, data URI, or already transformed by Cloudflare, return as-is
  if (
    !src ||
    src.startsWith('data:') ||
    src.endsWith('.svg') ||
    src.includes('/cdn-cgi/image/')
  ) {
    return src;
  }

  const q = quality || 80;
  const transformations = [
    `width=${width}`,
    `quality=${q}`,
    'format=auto',
    'fit=scale-down',
    'metadata=none',
  ].join(',');

  let normalizedSrc = src.trim();

  // Strip same-origin domain to form canonical same-zone relative paths
  const knownOrigins = [
    'https://executivemochi.pk',
    'http://executivemochi.pk',
    'https://www.executivemochi.pk',
    'http://www.executivemochi.pk',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  for (const origin of knownOrigins) {
    const cleanOrigin = origin.replace(/\/$/, '');
    if (normalizedSrc.startsWith(cleanOrigin)) {
      normalizedSrc = normalizedSrc.substring(cleanOrigin.length);
      break;
    }
  }

  // Handle remaining external absolute URLs
  if (normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://')) {
    return `/cdn-cgi/image/${transformations}/${normalizedSrc}`;
  }

  // Handle relative paths (e.g. /api/images/... or /images/...)
  const cleanSrc = normalizedSrc.startsWith('/') ? normalizedSrc : `/${normalizedSrc}`;
  return `/cdn-cgi/image/${transformations}${cleanSrc}`;
}
