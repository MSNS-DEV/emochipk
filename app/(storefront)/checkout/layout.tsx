import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Secure Checkout | Executive Mochi Pakistan',
  description: 'Complete your order with nationwide Cash on Delivery, Raast, JazzCash, or EasyPaisa.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
