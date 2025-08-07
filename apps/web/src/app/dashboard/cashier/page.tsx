"use client";

import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { usePollingData } from "@/hooks/usePollingData";
import {
  DollarSign,
  ShoppingCart,
  User,
  LogOut,
  CheckCircle,
  Clock,
  Timer,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { OrderStatus } from "@/types";

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    loading: ordersLoading,
    refreshData,
    lastUpdate,
    isConnected,
  } = usePollingData();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const handleOrderStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    setUpdatingOrderId(orderId);

    try {
      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
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

  const handleProcessPayment = async (
    orderId: string,
    paymentMethod: "CASH" | "CARD" | "DIGITAL",
    transactionId?: string
  ) => {
    setUpdatingOrderId(orderId);

    try {
      const response = await apiRequest(`/api/orders/${orderId}/payment`, {
        method: "POST",
        body: JSON.stringify({ 
          paymentMethod,
          transactionId: transactionId || undefined
        }),
      });

      if (response.ok) {
        toast.success(`Payment processed successfully via ${paymentMethod}`);
        refreshData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders for cashier (PENDING, CONFIRMED, PAID)
  const allCashierOrders = orders
    .filter((order) => ["PENDING", "CONFIRMED", "PAID"].includes(order.status))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  // Pagination logic
  const totalPages = Math.ceil(allCashierOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const cashierOrders = allCashierOrders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate stats for the dashboard
  const cashierStats = {
    pendingOrders: orders.filter((order) => order.status === "PENDING").length,
    confirmedOrders: orders.filter((order) => order.status === "CONFIRMED")
      .length,
    paidOrders: orders.filter((order) => order.status === "PAID").length,
    totalRevenue: orders
      .filter((order) => order.status === "PAID")
      .reduce((sum, order) => sum + Number(order.totalAmount), 0),
  };

  return (
    <ProtectedRoute allowedRoles={["CASHIER"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Cashier Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Welcome back, {user?.name}! Process orders and handle
                  payments.
                </p>
                {/* Polling Status Indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-muted-foreground">
                      {isConnected ? "Connected" : "Polling Mode"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={ordersLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    ordersLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card
              className={`${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cashierStats.pendingOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cashierStats.confirmedOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for payment
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paid Orders
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cashierStats.paidOrders}
                </div>
                <p className="text-xs text-muted-foreground">Sent to kitchen</p>
              </CardContent>
            </Card>

            <Card
              className={`${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${cashierStats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From paid orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orders Management */}
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Process pending orders and handle payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>Loading orders...</p>
                </div>
              ) : cashierOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No orders to process
                  </h3>
                  <p className="text-muted-foreground">
                    New orders from reception will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cashierOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="border-l-4 border-l-blue-400"
                    >
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
                                <DollarSign className="h-3 w-3" />$
                                {Number(order.totalAmount).toFixed(2)}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "CONFIRMED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-2">Items:</h4>
                            <div className="space-y-1">
                              {order.orderItems?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {item.quantity}x {item.menuItem?.name}
                                  </span>
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
                              <p className="text-sm">
                                <strong>Notes:</strong> {order.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            {order.status === "PENDING" && (
                              <Button
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "CONFIRMED")
                                }
                                disabled={updatingOrderId === order.id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {updatingOrderId === order.id
                                  ? "Confirming..."
                                  : "Confirm Order"}
                              </Button>
                            )}

                            {order.status === "CONFIRMED" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleProcessPayment(order.id, "CASH")
                                  }
                                  disabled={updatingOrderId === order.id}
                                  className="bg-green-600 hover:bg-green-700"
                                  size="sm"
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  {updatingOrderId === order.id
                                    ? "Processing..."
                                    : "Cash"}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleProcessPayment(order.id, "CARD")
                                  }
                                  disabled={updatingOrderId === order.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  size="sm"
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  {updatingOrderId === order.id
                                    ? "Processing..."
                                    : "Card"}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleProcessPayment(order.id, "DIGITAL")
                                  }
                                  disabled={updatingOrderId === order.id}
                                  className="bg-purple-600 hover:bg-purple-700"
                                  size="sm"
                                >
                                  <Wifi className="mr-2 h-4 w-4" />
                                  {updatingOrderId === order.id
                                    ? "Processing..."
                                    : "Digital"}
                                </Button>
                              </div>
                            )}

                            {order.status === "PAID" && (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-medium">
                                    Payment Completed!
                                  </span>
                                </div>
                                {order.payment && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>Method: {order.payment.paymentMethod}</span>
                                    <span>•</span>
                                    <span>Amount: ${Number(order.payment.amount).toFixed(2)}</span>
                                  </div>
                                )}
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
              {allCashierOrders.length > ordersPerPage && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, allCashierOrders.length)} of {allCashierOrders.length} orders
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
