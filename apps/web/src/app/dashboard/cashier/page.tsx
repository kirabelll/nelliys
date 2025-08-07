"use client";

import ProtectedRoute from "@/components/protected-route";
import { authClient } from "@/lib/auth-client";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import {
  DollarSign,
  ShoppingCart,
  User,
  LogOut,
  CheckCircle,
  Clock,
  Timer,
  CreditCard,
  RefreshCw,
  Wifi,
  AlertCircle,
  Package,
  Activity,
} from "lucide-react";
import type { OrderStatus } from "@/types";

export default function CashierDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await apiRequest("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Get user session
  useEffect(() => {
    const getSession = async () => {
      const { data: session } = await authClient.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getSession();
  }, []);

  // Initial data load and polling setup
  useEffect(() => {
    fetchOrders();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchOrders();
  };

  const handleLogout = async () => {
    await authClient.signOut();
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
          transactionId: transactionId || undefined,
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

  // Filter orders by status
  const ordersByStatus = useMemo(() => {
    const newOrders = orders.filter((order) => order.status === "PENDING");
    const confirmedOrders = orders.filter(
      (order) => order.status === "CONFIRMED"
    );
    const paidOrders = orders.filter((order) => order.status === "PAID");

    return {
      newOrders: newOrders.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      confirmedOrders: confirmedOrders.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      paidOrders: paidOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  }, [orders]);

  // Payment method statistics
  const paymentStats = useMemo(() => {
    const paidOrdersWithPayment = ordersByStatus.paidOrders.filter(
      (order) => order.payment
    );

    const stats = {
      cash: paidOrdersWithPayment.filter(
        (order) => order.payment?.paymentMethod === "CASH"
      ).length,
      card: paidOrdersWithPayment.filter(
        (order) => order.payment?.paymentMethod === "CARD"
      ).length,
      digital: paidOrdersWithPayment.filter(
        (order) => order.payment?.paymentMethod === "DIGITAL"
      ).length,
      total: paidOrdersWithPayment.length,
      totalAmount: paidOrdersWithPayment.reduce(
        (sum, order) => sum + Number(order.payment?.amount || 0),
        0
      ),
    };

    return stats;
  }, [ordersByStatus.paidOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  const renderOrderCard = (order: any) => (
    <Card key={order.id} className="border-l-4 border-l-blue-400">
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
                {formatCurrency(Number(order.totalAmount))}
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
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menuItem?.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(Number(item.totalPrice))}
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
                onClick={() => handleOrderStatusUpdate(order.id, "CONFIRMED")}
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
                  onClick={() => handleProcessPayment(order.id, "CASH")}
                  disabled={updatingOrderId === order.id}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {updatingOrderId === order.id ? "Processing..." : "Cash"}
                </Button>
                <Button
                  onClick={() => handleProcessPayment(order.id, "CARD")}
                  disabled={updatingOrderId === order.id}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {updatingOrderId === order.id ? "Processing..." : "Card"}
                </Button>
                <Button
                  onClick={() => handleProcessPayment(order.id, "DIGITAL")}
                  disabled={updatingOrderId === order.id}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <Wifi className="mr-2 h-4 w-4" />
                  {updatingOrderId === order.id ? "Processing..." : "Digital"}
                </Button>
              </div>
            )}

            {order.status === "PAID" && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Payment Completed!</span>
                </div>
                {order.payment && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Method: {order.payment.paymentMethod}</span>
                    <span>•</span>
                    <span>
                      Amount: {formatCurrency(Number(order.payment.amount))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={["CASHIER"]}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Cashier Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Manage orders and process payments.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last updated: {lastUpdate?.toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-600">
                    Polling Mode (Auto-refresh)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
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
              <Button
                variant="outline"
                onClick={() => {
                  toast.info(
                    "Polling mode active - Auto-refreshing every 30 seconds"
                  );
                }}
              >
                Connection Status
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Payment Statistics */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Cash Payments
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  {paymentStats.cash}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {paymentStats.total > 0
                    ? `${(
                        (paymentStats.cash / paymentStats.total) *
                        100
                      ).toFixed(1)}% of payments`
                    : "No payments yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Card Payments
                </CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">
                  {paymentStats.card}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {paymentStats.total > 0
                    ? `${(
                        (paymentStats.card / paymentStats.total) *
                        100
                      ).toFixed(1)}% of payments`
                    : "No payments yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Digital Payments
                </CardTitle>
                <Wifi className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">
                  {paymentStats.digital}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {paymentStats.total > 0
                    ? `${(
                        (paymentStats.digital / paymentStats.total) *
                        100
                      ).toFixed(1)}% of payments`
                    : "No payments yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Total Revenue
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800">
                  {formatCurrency(paymentStats.totalAmount)}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  {paymentStats.total} completed payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Order Management */}
          <Tabs defaultValue="new" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                New Orders ({ordersByStatus.newOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="confirmed"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Confirmed ({ordersByStatus.confirmedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Payment Completed ({ordersByStatus.paidOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    New Orders - Awaiting Confirmation
                  </CardTitle>
                  <CardDescription>
                    Orders that need to be confirmed before payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : ordersByStatus.newOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-600">
                        No new orders
                      </h3>
                      <p className="text-gray-500">
                        New orders will appear here when created
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordersByStatus.newOrders.map(renderOrderCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Confirmed Orders - Ready for Payment
                  </CardTitle>
                  <CardDescription>
                    Orders confirmed and ready for payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : ordersByStatus.confirmedOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-600">
                        No confirmed orders
                      </h3>
                      <p className="text-gray-500">
                        Confirmed orders ready for payment will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordersByStatus.confirmedOrders.map(renderOrderCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paid" className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Payment Completed - Sent to Kitchen
                  </CardTitle>
                  <CardDescription>
                    Orders with completed payments, sent to kitchen for
                    preparation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : ordersByStatus.paidOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-600">
                        No completed payments
                      </h3>
                      <p className="text-gray-500">
                        Orders with completed payments will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordersByStatus.paidOrders.map(renderOrderCard)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
