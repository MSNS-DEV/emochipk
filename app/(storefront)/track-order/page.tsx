"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Box,
} from "lucide-react"
import { api } from "@/lib/trpc"

/**
 * Maps order statuses to display configurations.
 */
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Package }
> = {
  PENDING:                       { label: "Order Placed",               color: "bg-slate-100 text-slate-700",    icon: Package },
  PENDING_VERIFICATION:          { label: "Pending Verification",       color: "bg-amber-100 text-amber-800",    icon: ShieldCheck },
  VERIFIED:                      { label: "Verified",                   color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  PROCESSING:                    { label: "Processing",                 color: "bg-blue-100 text-blue-800",      icon: Clock },
  PACKED:                        { label: "Packed",                     color: "bg-indigo-100 text-indigo-800",  icon: Box },
  SHIPPED:                       { label: "Shipped",                    color: "bg-violet-100 text-violet-800",  icon: Truck },
  OUT_FOR_DELIVERY:              { label: "Out for Delivery",           color: "bg-orange-100 text-orange-800",  icon: MapPin },
  DELIVERED:                     { label: "Delivered",                  color: "bg-green-100 text-green-800",    icon: PackageCheck },
  CANCELLED:                     { label: "Cancelled",                  color: "bg-red-100 text-red-800",        icon: AlertCircle },
  CANCELLED_VERIFICATION_FAILED: { label: "Verification Failed",       color: "bg-red-100 text-red-800",        icon: AlertCircle },
  RTO:                           { label: "Returned to Origin",         color: "bg-rose-100 text-rose-800",      icon: RotateCcw },
  RETURNED:                      { label: "Returned",                   color: "bg-rose-100 text-rose-800",      icon: RotateCcw },
}

/** The standard order lifecycle steps for the progress tracker */
const LIFECYCLE_STEPS = [
  { status: "PENDING",          label: "Order Placed",     icon: Package },
  { status: "VERIFIED",         label: "Confirmed",        icon: CheckCircle },
  { status: "PROCESSING",       label: "Processing",       icon: Clock },
  { status: "PACKED",           label: "Packed",           icon: Box },
  { status: "SHIPPED",          label: "Shipped",          icon: Truck },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { status: "DELIVERED",        label: "Delivered",        icon: PackageCheck },
]

/** Returns the step index the order has reached in the lifecycle */
function getLifecycleIndex(status: string): number {
  const idx = LIFECYCLE_STEPS.findIndex((s) => s.status === status)
  // If status is PENDING_VERIFICATION or VERIFIED, count as step 1
  if (status === "PENDING_VERIFICATION") return 1
  return idx >= 0 ? idx : -1
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [searchNumber, setSearchNumber] = useState("")

  const {
    data: result,
    isLoading,
    error,
    isError,
  } = api.courier.trackByOrderNumber.useQuery(searchNumber, {
    enabled: searchNumber.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderNumber.trim()) {
      setSearchNumber(orderNumber.trim())
    }
  }

  const statusConfig = result?.order
    ? STATUS_CONFIG[result.order.status] || STATUS_CONFIG.PENDING
    : STATUS_CONFIG.PENDING

  const lifecycleIndex = result?.order
    ? getLifecycleIndex(result.order.status)
    : -1

  // Determine if the order is in a terminal/abnormal state
  const isTerminal = result?.order
    ? ["CANCELLED", "CANCELLED_VERIFICATION_FAILED", "RTO", "RETURNED"].includes(
        result.order.status
      )
    : false

  // Build the timeline from courier events or stored events
  const timelineEvents =
    result?.courier?.events ??
    result?.storedEvents?.map((e) => ({
      status: e.status,
      statusMessage: e.statusMessage || e.status,
      location: e.location,
      timestamp: new Date(e.timestamp),
    })) ??
    []

  return (
    <div className="min-h-screen py-16 bg-muted/30">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Track Your Order</h1>
          <p className="text-lg text-muted-foreground">
            Enter your order number to get real-time updates on your delivery.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g. EM-XXXXXXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full sm:w-auto gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isLoading ? "Tracking..." : "Track Order"}
                </Button>
              </div>
            </form>

            {/* Error message */}
            {isError && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  {error?.message?.includes("NOT_FOUND")
                    ? "No order found with that number. Please check and try again."
                    : "Something went wrong. Please try again later."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Fetching tracking information from courier...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-2xl">
                      Order #{result.order.orderNumber}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                      {result.order.courierService && (
                        <span>
                          Courier:{" "}
                          <strong>
                            {result.courier?.courierName ||
                              ("courierName" in result.order
                                ? (result.order as { courierName?: string }).courierName
                                : result.order.courierService)}
                          </strong>
                        </span>
                      )}
                      {result.order.trackingNumber && (
                        <>
                          <span>&bull;</span>
                          <span>
                            Tracking: <strong>{result.order.trackingNumber}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={`text-sm px-3 py-1 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </Badge>
                    {result.courier?.estimatedDelivery && (
                      <p className="text-sm text-muted-foreground">
                        Est. Delivery: {result.courier.estimatedDelivery}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Lifecycle Progress Bar (only for normal flow orders) */}
              {!isTerminal && lifecycleIndex >= 0 && (
                <CardContent className="pb-6">
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
                    {LIFECYCLE_STEPS.map((step, index) => {
                      const StepIcon = step.icon
                      const reached = index <= lifecycleIndex
                      const isCurrent = index === lifecycleIndex
                      return (
                        <div key={step.status} className="flex flex-col items-center min-w-[4.5rem] relative">
                          {/* Connector line */}
                          {index > 0 && (
                            <div
                              className={`absolute top-5 -left-[calc(50%-0.25rem)] w-[calc(100%-0.5rem)] h-0.5 ${
                                reached ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                              isCurrent
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                : reached
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <span
                            className={`text-xs mt-2 text-center ${
                              reached ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Items */}
            {result.order.items && result.order.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.variant.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Size: {item.variant.sizeUK} &bull; Color: {item.variant.color} &bull; Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Tracking Timeline */}
            {timelineEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tracking Timeline</CardTitle>
                  {!result.trackingSupported && result.order.courierService && (
                    <p className="text-sm text-muted-foreground">
                      Live tracking is not yet available for{" "}
                      {"courierName" in result.order
                        ? (result.order as { courierName?: string }).courierName
                        : result.order.courierService}
                      . Showing stored updates.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {[...timelineEvents].reverse().map((event, index) => {
                      const isLatest = index === 0
                      return (
                        <div key={index} className="flex gap-4 pb-8 last:pb-0 relative">
                          {/* Vertical connector line */}
                          {index < timelineEvents.length - 1 && (
                            <div
                              className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${
                                isLatest ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                          {/* Event dot */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              isLatest
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isLatest ? (
                              <Truck className="h-5 w-5" />
                            ) : (
                              <CheckCircle className="h-5 w-5" />
                            )}
                          </div>
                          {/* Event details */}
                          <div className="pt-1.5 flex-1">
                            <p
                              className={`font-medium ${
                                isLatest ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {event.statusMessage || event.status}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                              <span>
                                {new Date(event.timestamp).toLocaleDateString("en-PK", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                –{" "}
                                {new Date(event.timestamp).toLocaleTimeString("en-PK", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {event.location && (
                                <>
                                  <span>&bull;</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No tracking info message */}
            {timelineEvents.length === 0 && !result.order.trackingNumber && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">No Tracking Information Yet</p>
                  <p className="mt-1">
                    Your order is being prepared. Tracking information will be available once
                    your parcel is handed over to the courier.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Shipping destination */}
            {result.order.shippingAddress && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>
                      Delivering to: <strong>{result.order.shippingAddress.city}</strong>,{" "}
                      {result.order.shippingAddress.province}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
