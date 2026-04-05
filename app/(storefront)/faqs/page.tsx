"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"
import Link from "next/link"

const faqs = [
  {
    category: "Ordering",
    items: [
      { q: "How do I place an order?", a: "Browse our collection at /shop, select your size and color, then add to cart. Proceed to checkout and complete payment. You'll receive a confirmation SMS and email immediately." },
      { q: "Can I order by phone?", a: "Yes! Call us at +92 52 6543210 (Pasrur) or +92 52 6789012 (Daska) during store hours (Mon–Sat, 10 AM – 9 PM) and our team will help place your order." },
      { q: "Do you offer custom shoes?", a: "We currently offer custom sizing and color combinations for select styles. Contact us directly for custom order inquiries. Please note custom orders are non-returnable." },
      { q: "How can I check my order status?", a: "Use our Track Order page and enter your order number. You can also log in to your account to view your order history and current status." },
    ],
  },
  {
    category: "Sizing & Fit",
    items: [
      { q: "How do I find my shoe size?", a: "Visit our Size Guide page for detailed measurements. We recommend measuring both feet and using the larger measurement. Our shoes are available in sizes 6–12 (UK)." },
      { q: "Do your shoes run true to size?", a: "Our formal shoes (Oxford, Derby) run true to size. Boots may run slightly narrow — consider sizing up if you have wide feet. Check each product page for specific recommendations." },
      { q: "What if the shoes don't fit?", a: "We offer free size exchanges within 7 days of delivery. The item must be unworn and in original packaging. Contact us to arrange a swap." },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      { q: "Do you deliver across Pakistan?", a: "Yes, we deliver nationwide. Delivery times range from same-day (Pasrur/Daska) to 2–7 business days depending on your location." },
      { q: "Is Cash on Delivery available?", a: "Yes, COD is available across all major cities. A PKR 50 handling fee applies. Our team may call to confirm your order before dispatch." },
      { q: "How much does shipping cost?", a: "Shipping is free for orders above PKR 5,000 within Punjab (PKR 8,000 for other provinces). See our full Shipping Policy for details." },
      { q: "Do you ship internationally?", a: "We currently ship within Pakistan only. International shipping is planned for 2025 — sign up to our newsletter to be notified." },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      { q: "What is your return policy?", a: "We accept returns within 7 days of delivery for unworn items in original packaging. Sale items are final sale and cannot be returned." },
      { q: "How long does a refund take?", a: "Refunds are processed within 3–5 business days after we receive and inspect the returned item. Bank transfers may take an additional 1–3 business days." },
      { q: "Who pays for return shipping?", a: "For defective or wrong items, we cover return shipping costs. For size exchanges or change of mind, the customer bears the return shipping fee." },
    ],
  },
  {
    category: "Shoe Care",
    items: [
      { q: "How should I care for leather shoes?", a: "Clean with a soft brush to remove dirt, then apply a matching shoe cream or polish. Use a shoe tree to maintain shape. Store in the provided dust bag away from direct sunlight." },
      { q: "Can I wear leather shoes in the rain?", a: "Full-grain leather is naturally water-resistant but not waterproof. Apply a leather conditioner/waterproofer spray before wear. Avoid prolonged exposure to heavy rain." },
      { q: "How do I care for Khussas?", a: "Wipe gently with a slightly damp cloth. Do not machine wash. Air dry naturally, away from direct heat. Apply leather conditioner occasionally to maintain suppleness." },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-medium">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-5 text-muted-foreground leading-relaxed pr-8">{a}</div>
      )}
    </div>
  )
}

export default function FAQsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Can&apos;t find your answer?{" "}
            <Link href="/contact" className="text-primary hover:underline">Contact our team</Link>
          </p>
        </div>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-serif font-bold mb-2 text-primary">{section.category}</h2>
              <div className="bg-card rounded-xl border px-6">
                {section.items.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-muted/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">Our team is available Mon–Sat, 10 AM – 9 PM to help you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Send us a message
            </Link>
            <a href="tel:+92526543210" className="inline-flex items-center justify-center px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors">
              Call +92 52 6543210
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
