import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Customer Support & Order Assistance',
  description:
    'Get in touch with Executive Mochi customer support. WhatsApp, phone (+92 300 6314988), and email for order tracking, size advice, and doorstep exchanges in Pakistan.',
  alternates: {
    canonical: 'https://executivemochi.pk/contact',
  },
  openGraph: {
    title: 'Contact Executive Mochi Pakistan',
    description: 'Direct WhatsApp and phone customer service for luxury handcrafted footwear inquiries.',
    url: 'https://executivemochi.pk/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
