import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | Executive Mochi',
  description: 'Review your selected handcrafted leather shoes and accessories before checkout.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
