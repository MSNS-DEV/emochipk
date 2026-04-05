"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, MapPin, Users, ArrowRight, CheckCircle } from "lucide-react"

const openings = [
  {
    title: "Senior Leather Craftsman",
    location: "Pasrur, Punjab",
    type: "Full-Time",
    dept: "Production",
    desc: "We are looking for a master craftsman with 5+ years in handmade leather footwear. You will lead our artisan team and maintain quality standards.",
    requirements: ["5+ years in leather shoe making", "Expertise in Goodyear welt construction", "Experience training junior artisans", "Strong attention to detail"],
  },
  {
    title: "Retail Sales Associate",
    location: "Daska, Punjab",
    type: "Full-Time",
    dept: "Retail",
    desc: "Join our Daska store team and help customers find the perfect pair. You'll be knowledgeable, friendly, and passionate about quality footwear.",
    requirements: ["1+ year retail experience", "Excellent communication skills (Urdu & Punjabi)", "Passion for fashion and footwear", "Availability Mon–Sat"],
  },
  {
    title: "Digital Marketing Executive",
    location: "Remote / Pasrur",
    type: "Full-Time",
    dept: "Marketing",
    desc: "Drive our online presence across Instagram, Facebook, and our website. Own content creation and help grow our e-commerce customer base.",
    requirements: ["2+ years digital marketing experience", "Instagram/Facebook Ads experience", "Graphic design skills (Canva/Adobe)", "E-commerce background preferred"],
  },
  {
    title: "Customer Service Representative",
    location: "Remote",
    type: "Part-Time",
    dept: "Customer Support",
    desc: "Handle customer inquiries via WhatsApp, phone, and email. Help with orders, returns, sizing, and general support. Flexible hours available.",
    requirements: ["Excellent written and verbal communication", "Problem-solving mindset", "Familiarity with e-commerce", "Available 4–6 hours/day Mon–Sat"],
  },
]

const deptColors: Record<string, string> = {
  Production: "bg-amber-100 text-amber-800",
  Retail: "bg-blue-100 text-blue-800",
  Marketing: "bg-purple-100 text-purple-800",
  "Customer Support": "bg-green-100 text-green-800",
}

export default function CareersPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    await new Promise(r => setTimeout(r, 800))
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Join Our Team</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re always looking for passionate people who take pride in their craft.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Users, title: "Family Culture", desc: "A close-knit team where every voice is heard." },
            { icon: Briefcase, title: "Craft-First Environment", desc: "We invest in skills and provide ongoing mentorship." },
            { icon: MapPin, title: "Two Locations", desc: "Pasrur & Daska, with remote opportunities available." },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="bg-muted/30 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            )
          })}
        </div>

        <h2 className="text-2xl font-serif font-bold mb-6">Current Openings</h2>
        <div className="space-y-6 mb-16">
          {openings.map((job) => (
            <Card key={job.title} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${deptColors[job.dept]}`}>{job.dept}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{job.type}</span>
                    </div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />{job.location}
                    </p>
                  </div>
                  <Button size="sm" className="gap-2 shrink-0" onClick={() => setSelected(job.title === selected ? null : job.title)}>
                    {selected === job.title ? "Close" : <><ArrowRight className="h-3.5 w-3.5" />Apply</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{job.desc}</p>
                <ul className="space-y-1">
                  {job.requirements.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />{r}
                    </li>
                  ))}
                </ul>

                {selected === job.title && (
                  <div className="mt-6 pt-6 border-t">
                    {submitted ? (
                      <div className="text-center py-6">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold mb-1">Application Submitted!</h4>
                        <p className="text-muted-foreground">We&apos;ll review your application and respond within 5 business days.</p>
                        <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setSelected(null) }}>Close</Button>
                      </div>
                    ) : (
                      <form onSubmit={handleApply} className="space-y-4">
                        <h4 className="font-semibold">Apply for: {job.title}</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5"><Label htmlFor={`name-${job.title}`}>Full Name</Label><Input id={`name-${job.title}`} placeholder="Ahmed Khan" required /></div>
                          <div className="space-y-1.5"><Label htmlFor={`phone-${job.title}`}>Phone</Label><Input id={`phone-${job.title}`} type="tel" placeholder="+92 300 1234567" required /></div>
                        </div>
                        <div className="space-y-1.5"><Label htmlFor={`email-${job.title}`}>Email</Label><Input id={`email-${job.title}`} type="email" placeholder="ahmed@example.com" required /></div>
                        <div className="space-y-1.5"><Label htmlFor={`msg-${job.title}`}>Why do you want to join us?</Label><Textarea id={`msg-${job.title}`} rows={4} placeholder="Tell us about yourself..." required /></div>
                        <Button type="submit" className="w-full">Submit Application</Button>
                      </form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-muted/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Don&apos;t see a fit?</h3>
          <p className="text-muted-foreground mb-4">Send your CV anyway — we&apos;re always open to talented people.</p>
          <a href="mailto:careers@executivemochi.pk" className="text-primary hover:underline font-medium">careers@executivemochi.pk</a>
        </div>
      </div>
    </div>
  )
}
