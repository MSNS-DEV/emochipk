import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wishlist | Executive Mochi',
  description: 'Your saved handcrafted footwear favorites and wishlist items.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
