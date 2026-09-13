import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed | Executive Mochi',
  description: 'Thank you for your order. Handcrafted luxury shoes are being prepared for dispatch.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
