import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | Executive Mochi Live Courier Tracking',
  description: 'Track your Executive Mochi parcel live across Leopards, PostEx, Trax, and TCS networks.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
