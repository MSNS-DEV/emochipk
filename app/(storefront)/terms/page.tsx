import { Scale } from "lucide-react"
import Link from "next/link"

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using the Executive Mochi website (executivemochi.pk) or placing any order with us, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please discontinue use of our website and services.",
  },
  {
    title: "2. Products & Pricing",
    content: "All product descriptions, images, and prices are as accurate as possible. We reserve the right to correct errors and update prices without prior notice. Prices are listed in Pakistani Rupees (PKR) and include applicable taxes. We may refuse or cancel orders if pricing errors occur.",
  },
  {
    title: "3. Orders & Payment",
    content: "By placing an order, you represent that you are at least 18 years old and authorized to use the chosen payment method. Payment must be completed before your order is dispatched (except for Cash on Delivery orders, which are verified by our team). We reserve the right to cancel orders suspected of fraud.",
  },
  {
    title: "4. Shipping & Delivery",
    content: "Delivery timelines are estimates and not guarantees. Executive Mochi is not liable for delays caused by courier partners, weather, or other circumstances beyond our control. Risk of loss and title for items pass to you upon delivery by the courier.",
  },
  {
    title: "5. Returns & Refunds",
    content: "Our return and exchange policy is governed by our separate Returns & Exchanges Policy, available at /returns. That policy is incorporated by reference into these Terms. Refunds, where approved, are issued to the original payment method within 3–5 business days of return approval.",
  },
  {
    title: "6. User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use. Executive Mochi is not liable for losses resulting from unauthorized use of your account.",
  },
  {
    title: "7. Intellectual Property",
    content: "All content on this website, including text, images, logos, product designs, and branding, is the property of Executive Mochi and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our prior written permission.",
  },
  {
    title: "8. Limitation of Liability",
    content: "To the fullest extent permitted by law, Executive Mochi shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or website. Our total liability to you shall not exceed the amount paid for the specific order in question.",
  },
  {
    title: "9. Governing Law",
    content: "These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Sialkot, Punjab, Pakistan.",
  },
  {
    title: "10. Changes to Terms",
    content: "We may update these Terms from time to time. Updated Terms will be posted on this page with a revised date. Continued use of our website after changes constitutes acceptance of the new Terms.",
  },
  {
    title: "11. Contact Information",
    content: "For any questions about these Terms, please contact us at legal@executivemochi.pk or visit our Contact page.",
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-10 text-sm text-amber-800">
          <strong>Summary:</strong> By shopping with us, you agree to these terms. We strive to be fair and transparent. 
          If you have any questions, <Link href="/contact" className="underline hover:no-underline">contact us</Link> before placing an order.
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="bg-card rounded-2xl border p-8">
              <h2 className="text-lg font-serif font-bold mb-3">{section.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
