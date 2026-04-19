import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from '@/app/providers'
import { CartProvider } from '@/lib/cart-context'
import { Toaster } from '@/components/ui/sonner'
import { JsonLd } from '@/components/seo/JsonLd'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://executivemochi.pk'),
  title: {
    default: 'Executive Mochi - Luxury Handcrafted Footwear',
    template: '%s | Executive Mochi',
  },
  description: 'Discover premium handcrafted leather shoes from Pakistan. Executive Mochi offers luxury formal shoes, boots, loafers, and traditional Peshawaris crafted by master artisans.',
  keywords: [
    'Executive Mochi',
    'Executive Mochi Pakistan',
    'super shoes',
    'servis',
    'bata',
    'executive',
    'luxury shoes',
    'handcrafted footwear',
    'premium leather shoes',
    'handmade shoes',
    'formal shoes',
    'loafers',
    'leather boots',
    'oxfords',
    'brogues',
    'Peshawari chappal',
    'Kaptaan chappal',
    'traditional Pakistani footwear',
    'pure leather',
    'bespoke footwear',
    'mens premium footwear',
    'Pakistani shoes',
    'executive shoes',
    'servis shoes',
    'bata shoes',
    'super shoes',
    'mochi shoes',
    'handmade in Pakistan'
  ],
  authors: [{ name: 'Executive Mochi' }],
  creator: 'Executive Mochi',
  publisher: 'Executive Mochi',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://executivemochi.pk',
    siteName: 'Executive Mochi',
    title: 'Executive Mochi - Luxury Handcrafted Footwear',
    description: 'Discover premium handcrafted leather shoes from Pakistan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Mochi - Luxury Handcrafted Footwear',
    description: 'Discover premium handcrafted leather shoes from Pakistan.',
  },
  robots: { index: true, follow: true },
  verification: {
    google: 'm11vzPasgLl-12Xr6HDhP0jGCr3NFijjjUK-ryBdUSo',
  },
  icons: {
    icon: '/logo.ico',
    apple: '/logo.ico',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f3ef' },
    { media: '(prefers-color-scheme: dark)', color: '#2d2820' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          <CartProvider>
            {children}
            <Toaster />
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    "@id": "https://executivemochi.pk/#organization",
                    "name": "Executive Mochi",
                    "url": "https://executivemochi.pk",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://executivemochi.pk/logo.ico",
                      "width": 512,
                      "height": 512
                    },
                    "description": "Premium handcrafted leather shoes from Pakistan.",
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": "Pasrur",
                      "addressRegion": "Sialkot",
                      "addressCountry": "Pakistan"
                    },
                    "contactPoint": {
                      "@type": "ContactPoint",
                      "telephone": "+92-XXX-XXXXXXX",
                      "contactType": "customer service"
                    }
                  },
                  {
                    "@type": "WebSite",
                    "@id": "https://executivemochi.pk/#website",
                    "url": "https://executivemochi.pk",
                    "name": "Executive Mochi",
                    "publisher": { "@id": "https://executivemochi.pk/#organization" },
                    "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://executivemochi.pk/shop?q={search_term_string}",
                      "query-input": "required name=search_term_string"
                    }
                  }
                ]
              }}
            />
          </CartProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
