import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, Phone, Clock, Award, Users, Leaf } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center">
        <Image
          src="/images/craftsman-banner.jpg"
          alt="Executive Mochi Craftsmanship"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">Our Story</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A legacy of craftsmanship spanning generations, rooted in the heart of Punjab
          </p>
        </div>
      </section>

      {/* Heritage Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Heritage</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-6">
                Crafting Excellence Since 1985
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Executive Mochi was founded with a singular vision: to bring the finest handcrafted 
                  Pakistani footwear to discerning customers who appreciate quality, comfort, and timeless style.
                </p>
                <p>
                  From our humble beginnings in Pasrur, we have grown to become one of Punjab&apos;s most 
                  respected names in luxury footwear. Our master craftsmen, many of whom learned their 
                  trade from their fathers and grandfathers, continue to employ traditional techniques 
                  passed down through generations.
                </p>
                <p>
                  Each pair of Executive Mochi shoes tells a story of dedication, skill, and an unwavering 
                  commitment to excellence. We source only the finest leathers and materials, ensuring 
                  that every shoe we create meets our exacting standards.
                </p>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <Image
                src="/images/store-interior.jpg"
                alt="Executive Mochi Store"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2">What Drives Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Uncompromising Quality</h3>
              <p className="text-muted-foreground">
                We never cut corners. Every shoe undergoes rigorous quality checks to ensure it 
                meets our high standards before reaching you.
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Master Craftsmanship</h3>
              <p className="text-muted-foreground">
                Our artisans bring decades of experience to every pair, combining traditional 
                techniques with modern precision.
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sustainable Practices</h3>
              <p className="text-muted-foreground">
                We are committed to responsible sourcing and eco-friendly production methods 
                that respect our environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stores Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-sm font-medium text-primary tracking-wider uppercase">Visit Us</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2">Our Stores</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Experience Executive Mochi in person at our flagship stores
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card p-8 rounded-2xl border">
              <h3 className="text-xl font-semibold mb-4">Pasrur Flagship Store</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <span>Main Bazaar, Near Clock Tower, Pasrur, Punjab</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+92 52 6543210</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>10:00 AM - 9:00 PM (Mon-Sat)</span>
                </div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-2xl border">
              <h3 className="text-xl font-semibold mb-4">Ghakhar Store</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <span>G.T Road, Ghakhar,  Punjab</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+92 300 7429488</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>10:00 AM - 9:00 PM (Mon-Sat)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Experience the Difference
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Discover why thousands of customers trust Executive Mochi for their finest footwear needs.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/shop">Shop Our Collection</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
