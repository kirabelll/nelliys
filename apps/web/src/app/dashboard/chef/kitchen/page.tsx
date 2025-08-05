"use client";

import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { usePollingData } from "@/hooks/usePollingData";
import { 
  ChefHat, 
  CheckCircle, 
  Clock,
  Coffee,
  Timer,
  User,
  DollarSign,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import Link from "next/link";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function KitchenOrdersPage() {
  const { user } = useAuth();
  const { orders, loading: ordersLoading, refreshData } = usePollingData();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const handleOrderStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    
    try {
      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Order marked as ${newStatus.toLowerCase()}`);
        refreshData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders for kitchen (chef can see PAID, PREPARING, READY orders)
  const allKitchenOrders = orders.filter(order => 
    ['PAID', 'PREPARING', 'READY'].includes(order.status)
  ).sort((a, b) => {
    // Sort by status priority and creation time
    const statusPriority = { 'PAID': 1, 'PREPARING': 2, 'READY': 3 };
    const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 4;
    const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 4;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same status, sort by creation time (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Pagination logic
  const totalPages = Math.ceil(allKitchenOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const kitchenOrders = allKitchenOrders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate stats for the kitchen
  const kitchenStats = {
    newOrders: orders.filter(order => order.status === 'PAID').length,
    preparing: orders.filter(order => order.status === 'PREPARING').length,
    ready: orders.filter(order => order.status === 'READY').length,
    completedToday: orders.filter(order => {
      const today = new Date().toDateString();
      return order.status === 'COMPLETED' && 
             new Date(order.createdAt).toDateString() === today;
    }).length
  };

  return (
    <ProtectedRoute allowedRoles={["CHEF"]}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/chef">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Orders</h1>
                <p className="text-muted-foreground">
                  Manage food preparation and mark orders as ready to serve
                </p>
              </div>
            </div>
          </div>

          {/* Kitchen Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kitchenStats.newOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Ready to prepare
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preparing</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kitchenStats.preparing}</div>
                <p className="text-xs text-muted-foreground">
                  Currently cooking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kitchenStats.ready}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting pickup
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kitchenStats.completedToday}</div>
                <p className="text-xs text-muted-foreground">
                  Orders finished
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Kitchen Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChefHat className="mr-2 h-5 w-5" />
                Active Kitchen Orders
              </CardTitle>
              <CardDescription>
                Orders ready for preparation and cooking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>Loading kitchen orders...</p>
                </div>
              ) : kitchenOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders in kitchen</h3>
                  <p className="text-muted-foreground">
                    All caught up! New orders will appear here when they're ready for preparation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Debug info - show order flow */}
                  {orders.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Order Flow Status</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>Total orders: {orders.length}</p>
                        <p>PENDING (Reception created): {orders.filter(o => o.status === 'PENDING').length}</p>
                        <p>CONFIRMED (Cashier accepted): {orders.filter(o => o.status === 'CONFIRMED').length}</p>
                        <p>PAID (Ready for kitchen): {orders.filter(o => o.status === 'PAID').length}</p>
                        <p>PREPARING (Chef cooking): {orders.filter(o => o.status === 'PREPARING').length}</p>
                        <p>READY (Food ready): {orders.filter(o => o.status === 'READY').length}</p>
                        <p>Kitchen orders visible: {allKitchenOrders.length} (showing {kitchenOrders.length})</p>
                      </div>
                    </div>
                  )}
                  
                  {kitchenOrders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-orange-400">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.orderNumber}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.customer?.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${Number(order.totalAmount).toFixed(2)}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[order.status]}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-2">Items to prepare:</h4>
                            <div className="space-y-1">
                              {order.orderItems?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.quantity}x {item.menuItem?.name}</span>
                                  <span className="text-muted-foreground">
                                    ${Number(item.totalPrice).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Notes */}
                          {order.notes && (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {order.status === 'PAID' && (
                              <Button
                                onClick={() => handleOrderStatusUpdate(order.id, 'PREPARING')}
                                disabled={updatingOrderId === order.id}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <ChefHat className="mr-2 h-4 w-4" />
                                {updatingOrderId === order.id ? 'Starting...' : 'Start Preparing'}
                              </Button>
                            )}
                            
                            {order.status === 'PREPARING' && (
                              <Button
                                onClick={() => handleOrderStatusUpdate(order.id, 'READY')}
                                disabled={updatingOrderId === order.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {updatingOrderId === order.id ? 'Marking...' : 'Food is Ready to Serve'}
                              </Button>
                            )}
                            
                            {order.status === 'READY' && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium">Ready for pickup!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {allKitchenOrders.length > ordersPerPage && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, allKitchenOrders.length)} of {allKitchenOrders.length} kitchen orders
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}