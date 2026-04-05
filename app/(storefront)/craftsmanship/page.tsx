import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Scissors, Hammer, Star, Clock } from "lucide-react"

const steps = [
  {
    num: "01",
    title: "Material Selection",
    desc: "We source only the finest full-grain and calfskin leathers from certified tanneries. Every hide is hand-inspected for consistency, grain quality, and durability before it ever touches the workbench.",
    icon: Star,
  },
  {
    num: "02",
    title: "Pattern Cutting",
    desc: "Each shoe pattern is cut by hand using precision steel dies. Our craftsmen have decades of experience ensuring exact tolerances — the foundation of a perfect fit.",
    icon: Scissors,
  },
  {
    num: "03",
    title: "Hand Lasting",
    desc: "The upper is stretched over a wooden last and secured using traditional hand-nailing techniques. This process shapes the shoe and ensures it maintains its form for years.",
    icon: Hammer,
  },
  {
    num: "04",
    title: "Stitching & Welting",
    desc: "Goodyear welt construction binds the upper, welt, and sole with a row of hand-guided stitching. This time-honored method allows the shoe to be resoled, extending its life indefinitely.",
    icon: Scissors,
  },
  {
    num: "05",
    title: "Finishing & Polish",
    desc: "Each shoe is burnished, edge-trimmed, and hand-polished multiple times to achieve the deep, rich lustre we're known for. Final quality inspection ensures every pair meets our exacting standards.",
    icon: Star,
  },
  {
    num: "06",
    title: "Quality Assurance",
    desc: "Before packaging, every pair goes through a 27-point quality checklist. Only shoes that pass every criterion are approved to carry the Executive Mochi name.",
    icon: Clock,
  },
]

export default function CraftsmanshipPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center">
        <Image
          src="/images/craftsman-banner.jpg"
          alt="Executive Mochi Craftsman at Work"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Art</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mt-3 mb-4">The Craft Behind Every Pair</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Over 200 individual steps. Decades of mastery. One flawless shoe.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20">
        <div className="container max-w-3xl text-center">
          <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Philosophy</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3 mb-6">
            Where Tradition Meets Precision
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-6">
            At Executive Mochi, we believe that a truly great shoe is the result of hundreds of small 
            decisions made with care and intention. Every cut of leather, every stitch of thread, 
            every stroke of polish — each one matters.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Our master craftsmen in Pasrur have inherited techniques passed down through generations, 
            refined with modern knowledge to create footwear that is as beautiful as it is durable.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-primary tracking-wider uppercase">The Process</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3">From Hide to Shoe</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="bg-card rounded-2xl p-8 border">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-serif font-bold text-primary/20">{step.num}</span>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <Image
                src="/images/store-interior.jpg"
                alt="Executive Mochi Premium Leathers"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-medium text-primary tracking-wider uppercase">Our Materials</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3 mb-6">
                Only the Finest Leathers
              </h2>
              <div className="space-y-6 text-muted-foreground">
                <div>
                  <h4 className="text-foreground font-semibold mb-1">Full-Grain Leather</h4>
                  <p>The highest grade of leather, featuring the complete grain surface. It develops a rich patina over time and is the most durable option available.</p>
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-1">Calfskin</h4>
                  <p>Sourced from young calves, this leather is exceptionally soft and supple. It takes polish beautifully and is prized for formal footwear.</p>
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-1">Suede</h4>
                  <p>Buffed from the inner split of the hide, our suede is dense and napped evenly. Perfect for casual boots and loafers.</p>
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-1">Traditional Embroidery Thread</h4>
                  <p>For our Khussas, we use silk and metallic threads sourced locally by artisan families who have practiced this craft for generations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Experience It for Yourself
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Every pair of Executive Mochi shoes carries the heritage of our craft. Discover the collection.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/shop">Shop the Collection</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
