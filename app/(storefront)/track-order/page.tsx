"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react"

const mockTracking = {
  orderNumber: "EM-2024-001235",
  status: "IN_TRANSIT",
  estimatedDelivery: "December 18, 2024",
  courier: "Trax Courier",
  trackingNumber: "TX987654321PK",
  timeline: [
    { step: "Order Placed", date: "Dec 10, 2024 – 2:30 PM", done: true, icon: Package },
    { step: "Payment Confirmed", date: "Dec 10, 2024 – 2:35 PM", done: true, icon: CheckCircle },
    { step: "Processing at Warehouse", date: "Dec 11, 2024 – 10:00 AM", done: true, icon: Clock },
    { step: "Dispatched", date: "Dec 12, 2024 – 9:00 AM", done: true, icon: Truck },
    { step: "In Transit", date: "Dec 12, 2024 – 3:00 PM", done: true, icon: Truck },
    { step: "Out for Delivery", date: "Pending", done: false, icon: MapPin },
    { step: "Delivered", date: "Estimated Dec 18", done: false, icon: CheckCircle },
  ],
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [result, setResult] = useState<typeof mockTracking | null>(null)
  const [error, setError] = useState("")

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderNumber.trim() === mockTracking.orderNumber) {
      setResult(mockTracking)
      setError("")
    } else {
      setResult(null)
      setError("No order found with that number. Try: EM-2024-001235")
    }
  }

  return (
    <div className="min-h-screen py-16 bg-muted/30">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Track Your Order</h1>
          <p className="text-lg text-muted-foreground">
            Enter your order number to get real-time updates on your delivery.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g. EM-2024-001235"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto gap-2">
                  <Search className="h-4 w-4" />
                  Track Order
                </Button>
              </div>
            </form>
            {error && <p className="text-destructive text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl">Order #{result.orderNumber}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Courier: {result.courier} &bull; Tracking: {result.trackingNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1">In Transit</Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Est. Delivery: {result.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {result.timeline.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div key={index} className="flex gap-4 pb-8 last:pb-0 relative">
                        {index < result.timeline.length - 1 && (
                          <div className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${item.done ? "bg-primary" : "bg-border"}`} />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${item.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="pt-1.5">
                          <p className={`font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.step}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
