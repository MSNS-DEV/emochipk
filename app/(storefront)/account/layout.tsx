import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account | Executive Mochi',
  description: 'Manage your profile, order history, shipping addresses, and customer shoe size memory.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
