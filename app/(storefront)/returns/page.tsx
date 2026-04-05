import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, ArrowRight, PhoneCall } from "lucide-react"
import Link from "next/link"

const eligible = [
  "Unworn shoes in original condition with all tags attached",
  "Returned within 7 days of delivery",
  "Original packaging (box, dust bag, tissue) intact",
  "Item purchased from executivemochi.pk or our physical stores",
]

const notEligible = [
  "Worn, used, or washed items",
  "Items returned after 7 days",
  "Sale or clearance items (marked as Final Sale)",
  "Custom or made-to-order shoes",
  "Items without original packaging",
]

const steps = [
  { num: "01", title: "Initiate Request", desc: "Contact us via WhatsApp, phone, or email with your order number and reason for return. We'll respond within 24 hours." },
  { num: "02", title: "Pack Your Item", desc: "Carefully repack the item in its original box with all accessories. Include a note with your order number inside." },
  { num: "03", title: "Ship It Back", desc: "Drop off the package at the nearest courier office. For local customers in Pasrur/Daska, we offer free pickup." },
  { num: "04", title: "Inspection & Approval", desc: "We inspect the returned item within 1–2 business days of receipt and notify you of approval via SMS/email." },
  { num: "05", title: "Refund or Exchange", desc: "Approved returns receive a store credit, exchange, or refund to original payment method within 3–5 business days." },
]

export default function ReturnsPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Returns & Exchanges</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not the right fit? No worries. We make returns and exchanges as smooth as possible.
          </p>
        </div>

        {/* Policy Summary */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-8 mb-12 text-center">
          <p className="text-2xl font-serif font-semibold">7-Day Return Window</p>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            We accept returns and exchanges within 7 days of delivery for all eligible items.
            Exchanges are always free for size swaps.
          </p>
        </div>

        {/* Eligibility */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-700">Eligible for Return</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {eligible.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-700">Not Eligible</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {notEligible.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Return Process */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-muted/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-1">Ready to start a return?</h3>
            <p className="text-muted-foreground">Reach out to our team and we&apos;ll guide you through the process.</p>
          </div>
          <Button asChild size="lg" className="gap-2 shrink-0">
            <Link href="/contact">
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
