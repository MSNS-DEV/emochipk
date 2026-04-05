import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react"

const stores = [
  {
    id: 1,
    name: "Executive Mochi – Pasrur Flagship",
    badge: "Flagship Store",
    address: "Main Bazaar, Near Clock Tower, Pasrur, Punjab",
    phone: "+92 52 6543210",
    mobile: "+92 300 1234567",
    email: "pasrur@executivemochi.pk",
    hours: [
      { day: "Monday – Saturday", time: "10:00 AM – 9:00 PM" },
      { day: "Sunday", time: "12:00 PM – 6:00 PM" },
    ],
    features: ["Full Collection Available", "Custom Fitting Service", "Master Craftsman On-Site", "Gift Wrapping", "Repair Services"],
    mapQuery: "Main+Bazaar+Clock+Tower+Pasrur+Punjab+Pakistan",
  },
  {
    id: 2,
    name: "Executive Mochi – Daska",
    badge: "Branch Store",
    address: "Railway Road, Opposite City Park, Daska, Punjab",
    phone: "+92 52 6789012",
    mobile: "+92 300 7654321",
    email: "daska@executivemochi.pk",
    hours: [
      { day: "Monday – Saturday", time: "10:00 AM – 9:00 PM" },
      { day: "Sunday", time: "Closed" },
    ],
    features: ["Full Collection Available", "Custom Fitting Service", "Gift Wrapping"],
    mapQuery: "Railway+Road+City+Park+Daska+Punjab+Pakistan",
  },
]

export default function StoresPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Stores</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visit us in person to experience our collection, get expert fitting advice, and take home a pair of handcrafted Executive Mochi shoes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden">
              <div className="bg-primary/5 px-6 pt-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{store.badge}</span>
                    <h2 className="text-xl font-serif font-bold mt-2">{store.name}</h2>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Address</p>
                    <p className="text-muted-foreground text-sm mt-0.5">{store.address}</p>
                    <a
                      href={`https://maps.google.com/maps?q=${store.mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      <Navigation className="h-3 w-3" />
                      Get Directions
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <a href={`tel:${store.phone}`} className="text-muted-foreground text-sm hover:text-foreground">{store.phone}</a>
                    <br />
                    <a href={`tel:${store.mobile}`} className="text-muted-foreground text-sm hover:text-foreground">{store.mobile}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <a href={`mailto:${store.email}`} className="text-muted-foreground text-sm hover:text-foreground">{store.email}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Store Hours</p>
                    {store.hours.map((h, i) => (
                      <p key={i} className="text-muted-foreground text-sm mt-0.5">
                        <span className="text-foreground">{h.day}:</span> {h.time}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-medium text-sm mb-2">Store Features</p>
                  <div className="flex flex-wrap gap-2">
                    {store.features.map((f) => (
                      <span key={f} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">{f}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note */}
        <div className="bg-muted/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Can&apos;t Visit In Person?</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Shop our full collection online with nationwide delivery. Our team can also assist you with sizes and recommendations over WhatsApp or phone.
          </p>
        </div>
      </div>
    </div>
  )
}
