import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'

import Script from 'next/script'
import { Providers } from '@/app/providers'
import { CartProvider } from '@/lib/cart-context'
import { Toaster } from '@/components/ui/sonner'
import { JsonLd } from '@/components/seo/JsonLd'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
    'executive mochi shoes',
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
    title: 'Executive Mochi - Luxury Handcrafted Footwear Pakistan',
    description: '100% genuine handcrafted leather shoes, formal Oxfords, casual Loafers, and authentic Peshawari Chappals with nationwide Cash on Delivery.',
    images: [
      {
        url: 'https://executivemochi.pk/images/hero-shoes.jpg',
        width: 1200,
        height: 630,
        alt: 'Executive Mochi - Handcrafted Luxury Leather Footwear Pakistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Executive Mochi - Luxury Handcrafted Footwear Pakistan',
    description: '100% genuine handcrafted leather shoes, formal Oxfords, casual Loafers, and authentic Peshawari Chappals.',
    images: ['https://executivemochi.pk/images/hero-shoes.jpg'],
  },
  robots: { index: true, follow: true },
  verification: {
    google: 'm11vzPasgLl-12Xr6HDhP0jGCr3NFijjjUK-ryBdUSo',
    other: {
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || 'B42E7FAEEB24B3CD86675B8B77BA8F51',
    },
  },
  other: {
    'google-adsense-account': 'ca-pub-1351871288722699',
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
      <head>
        {/* Google Tag Manager (Cloudflare Google Tag Gateway) */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TB7FCNZT');
          `}
        </Script>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1351871288722699"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q5439XSE2S"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q5439XSE2S');
          `}
        </Script>
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2488482501579231');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2488482501579231&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* Google Merchant Reviews Badge Widget */}
        <Script
          id="merchantWidgetScript"
          src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
          strategy="lazyOnload"
        />
        <Script id="merchant-widget-init" strategy="lazyOnload">
          {`
            (function() {
              function startWidget() {
                if (window.merchantwidget) {
                  window.merchantwidget.start({
                    merchant_id: 5778703057,
                    position: "BOTTOM_LEFT",
                    region: "PK"
                  });
                }
              }

              var script = document.getElementById('merchantWidgetScript');
              if (script) {
                script.addEventListener('load', startWidget);
              }
              if (window.merchantwidget) {
                startWidget();
              }
            })();
          `}
        </Script>
      </head>
      <body className="font-sans antialiased min-h-screen">
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TB7FCNZT"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>
          <CartProvider>
            {children}
            <Toaster />
            <Analytics />
            <SpeedInsights />
            <JsonLd
              id="org-ld"
              data={{
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": ["Organization", "LocalBusiness", "ShoeStore"],
                    "@id": "https://executivemochi.pk/#organization",
                    "name": "Executive Mochi",
                    "alternateName": "Executive Mochi Pakistan",
                    "url": "https://executivemochi.pk",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://executivemochi.pk/apple-icon.png",
                      "width": 180,
                      "height": 180
                    },
                    "image": "https://executivemochi.pk/images/hero-shoes.jpg",
                    "description": "Pakistan's premier luxury handcrafted footwear brand. Handcrafted genuine leather formal Oxfords, casual Loafers, and authentic Peshawari Chappals with nationwide Cash on Delivery.",
                    "priceRange": "PKR 4,500 - PKR 16,000",
                    "currenciesAccepted": "PKR",
                    "paymentAccepted": "Cash, Cash on Delivery, Raast, JazzCash, EasyPaisa, Debit Card, Credit Card",
                    "openingHours": "Mo-Sa 10:00-22:00, Su 12:00-18:00",
                    "telephone": "+92-300-6314988",
                    "email": "info@executivemochi.pk",
                    "address": {
                      "@type": "PostalAddress",
                      "streetAddress": "GT Road, Muhallah Shah Jamal",
                      "addressLocality": "Ghakhar",
                      "addressRegion": "Punjab",
                      "postalCode": "52250",
                      "addressCountry": "PK"
                    },
                    "geo": {
                      "@type": "GeoCoordinates",
                      "latitude": 32.2697,
                      "longitude": 74.1567
                    },
                    "hasMap": "https://maps.app.goo.gl/WZSPCXkbSfxy6MSJ7",
                    "sameAs": [
                      "https://www.facebook.com/share/1Di9T5ucH7/?mibextid=wwXIfr",
                      "https://www.instagram.com/officialsupershoes?igsh=MWI3NnQ1YTEycmZ4aQ%3D%3D"
                    ],
                    "contactPoint": {
                      "@type": "ContactPoint",
                      "telephone": "+92-300-6314988",
                      "contactType": "customer service",
                      "areaServed": "PK",
                      "availableLanguage": ["English", "Urdu", "Punjabi"]
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
                      "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://executivemochi.pk/shop?search={search_term_string}"
                      },
                      "query-input": "required name=search_term_string"
                    }
                  }
                ]
              }}
            />
          </CartProvider>
        </Providers>

      </body>
    </html>
  )
}
