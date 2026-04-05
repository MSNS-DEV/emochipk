import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Clock, MapPin, Package, ShieldCheck, PhoneCall } from "lucide-react"
import Link from "next/link"

const shippingZones = [
  { zone: "Pasrur & Daska", delivery: "Same Day / Next Day", fee: "Free", note: "Order before 3 PM for same-day delivery" },
  { zone: "Sialkot, Gujranwala, Lahore", delivery: "1–2 Business Days", fee: "Free on orders over PKR 5,000", note: "PKR 150 flat rate below threshold" },
  { zone: "Major Cities (Karachi, Islamabad, etc.)", delivery: "2–4 Business Days", fee: "Free on orders over PKR 8,000", note: "PKR 250 flat rate below threshold" },
  { zone: "Remote / Rural Areas", delivery: "4–7 Business Days", fee: "PKR 350", note: "Contact us for confirmation" },
]

export default function ShippingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Shipping Policy</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We deliver across Pakistan with care and speed. Here&apos;s everything you need to know about our shipping.
          </p>
        </div>

        {/* Delivery Zones */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6">Delivery Zones & Timeframes</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Zone</th>
                  <th className="text-left p-4 font-semibold">Delivery Time</th>
                  <th className="text-left p-4 font-semibold">Shipping Fee</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shippingZones.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4 font-medium">{row.zone}</td>
                    <td className="p-4 text-muted-foreground">{row.delivery}</td>
                    <td className="p-4 text-muted-foreground">{row.fee}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Info Cards */}
        <section className="grid sm:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Order Processing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm space-y-2">
              <p>Orders are processed Monday through Saturday, 10 AM – 6 PM.</p>
              <p>Orders placed on Sunday or public holidays will be processed the next business day.</p>
              <p>You&apos;ll receive an SMS & email confirmation once dispatched.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Cash on Delivery (COD)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm space-y-2">
              <p>COD is available across all major cities in Pakistan.</p>
              <p>A COD handling fee of PKR 50 applies to all COD orders.</p>
              <p>Our team may call to confirm your order before dispatch.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Order Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm space-y-2">
              <p>Track your order anytime via our <Link href="/track-order" className="text-primary hover:underline">Track Order</Link> page.</p>
              <p>You&apos;ll receive a tracking number via SMS once your order is dispatched.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Packaging</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm space-y-2">
              <p>All orders are packed in our signature Executive Mochi gift boxes.</p>
              <p>Each pair is wrapped with tissue and includes a dust bag for storage.</p>
              <p>We use eco-friendly packaging materials wherever possible.</p>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <div className="bg-muted/30 rounded-2xl p-8 text-center">
          <PhoneCall className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2">Questions about your shipment?</h3>
          <p className="text-muted-foreground mb-4">Our support team is available Mon–Sat, 10 AM – 9 PM.</p>
          <Link href="/contact" className="text-primary hover:underline font-medium">Contact Us →</Link>
        </div>
      </div>
    </div>
  )
}
