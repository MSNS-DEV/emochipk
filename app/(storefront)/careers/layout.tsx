import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers at Executive Mochi | Join Our Master Craftsmen & Team',
  description:
    'Join Pakistan’s leading handcrafted luxury footwear brand. Explore career opportunities in footwear craft, retail, marketing, and operations in Pasrur, Ghakhar, and remote.',
  alternates: {
    canonical: 'https://executivemochi.pk/careers',
  },
  openGraph: {
    title: 'Careers at Executive Mochi Pakistan',
    description: 'Work with master artisans and leather footwear professionals.',
    url: 'https://executivemochi.pk/careers',
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
