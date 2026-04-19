import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/account/',
        '/checkout/',
        '/order-success/',
        '/cart/',
        '/wishlist/',
        '/search/',
      ],
    },
    sitemap: 'https://executivemochi.pk/sitemap.xml',
  }
}
