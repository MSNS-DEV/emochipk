import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Premium Handcrafted Footwear & Leather Shoes',
  description:
    'Explore the complete Executive Mochi collection. 100% pure handcrafted leather formal Oxfords, casual Loafers, Moccasins, and traditional Peshawari Chappals. Free delivery & COD nationwide in Pakistan.',
  alternates: {
    canonical: 'https://executivemochi.pk/shop',
  },
  openGraph: {
    title: 'Shop Premium Handcrafted Leather Footwear | Executive Mochi',
    description:
      'Explore the complete Executive Mochi collection with Cash on Delivery and 7-day hassle-free exchanges across Pakistan.',
    url: 'https://executivemochi.pk/shop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Handcrafted Leather Shoes | Executive Mochi Pakistan',
    description:
      'Pure leather Oxfords, Loafers, Moccasins, and Peshawari Chappals crafted by master artisans.',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
