import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQs)',
  description:
    'Find answers regarding Executive Mochi handcrafted leather footwear: sizing, Cash on Delivery, shipping timelines across Pakistan, 7-day exchanges, and shoe care.',
  alternates: {
    canonical: 'https://executivemochi.pk/faqs',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQs) | Executive Mochi Pakistan',
    description: 'Everything you need to know about ordering, sizes, COD delivery, and exchanges.',
    url: 'https://executivemochi.pk/faqs',
  },
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are Executive Mochi shoes made of real leather?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. 100% of Executive Mochi leather shoes and Peshawari chappals are handcrafted from authentic, full-grain calfskin and goat leather. We do not use faux leather or Rexine in our leather uppers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer Cash on Delivery across Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Cash on Delivery (COD) is available for all cities and postal codes across Pakistan via Leopards, PostEx, and Trax couriers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your exchange policy if the size does not fit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Executive Mochi offers a 7-day hassle-free size exchange policy. If your shoes do not fit comfortably, contact us on WhatsApp (+92 300 6314988) and we will arrange an exchange.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does delivery take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nationwide delivery takes 2 to 4 business days. Major cities like Lahore, Islamabad, and Karachi typically receive deliveries in 2 to 3 days.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd id="faq-ld" data={faqSchema} />
      {children}
    </>
  );
}
