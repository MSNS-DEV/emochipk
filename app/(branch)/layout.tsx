import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Executive Mochi Branch Portal',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BranchRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
