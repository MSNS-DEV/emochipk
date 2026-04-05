"use client"

import { useAuth } from "@/lib/auth-context"
import { mockOrders, formatPrice } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package, ChevronRight, ArrowLeft } from "lucide-react"

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  COD_VERIFIED: "bg-teal-100 text-teal-800",
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    redirect("/login")
  }

  const userOrders = mockOrders.filter(order => order.userId === user?.id)

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>
          <h1 className="text-3xl font-serif font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage your orders</p>
        </div>

        {userOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-medium mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
              <Button asChild>
                <Link href="/shop">Browse Collection</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status] ?? "bg-gray-100 text-gray-800"}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Item #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.variantId} &bull; Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{formatPrice(order.total)}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
