"use client";

import { useState, useEffect, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import ProtectedRoute from "@/components/protected-route";
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
import { CustomerList } from "@/components/customers/customer-list";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import {
  Users,
  Coffee,
  ShoppingCart,
  LogOut,
  RefreshCw,
  Clock,
  Timer,
  DollarSign,
  User,
  Eye,
  Plus,
  AlertCircle,
  Package,
  CheckCircle,
  Activity,
} from "lucide-react";
import type { OrderStatus } from "@/types";

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ReceptionDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      console.log("Fetching orders...");
      const response = await apiRequest("/api/orders");
      console.log("Orders response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Orders data received:", data);
        setOrders(data.orders || []);
        setLastUpdate(new Date());
      } else {
        const errorText = await response.text();
        console.error("Orders fetch failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch customers data
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      console.log("Fetching customers...");
      const response = await apiRequest("/api/customers");
      console.log("Customers response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Customers data received:", data);
        setCustomers(data.customers || []);
      } else {
        const errorText = await response.text();
        console.error("Customers fetch failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Fetch stats data from analytics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      console.log("Fetching stats...");
      const response = await apiRequest("/api/analytics/reception-overview");
      console.log("Stats response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Stats data received:", data);
        setStats({
          totalCustomers: data.totalCustomers || 0,
          totalOrders: data.totalOrders || 0,
          todayOrders: data.todayOrders || 0,
          pendingOrders: data.pendingOrders || 0,
        });
      } else {
        const errorText = await response.text();
        console.error("Stats fetch failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
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
    fetchCustomers();
    fetchStats();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
      fetchCustomers();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchOrders();
    fetchCustomers();
    fetchStats();
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const handleOrderCreated = () => {
    setShowCreateDialog(false);
    fetchOrders(); // Refresh orders after creating new one
    fetchStats(); // Refresh stats after creating new one
  };

  // Filter and sort orders by status and latest time
  const ordersByStatus = useMemo(() => {
    const sortByLatest = (orders: any[]) =>
      orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const allOrders = sortByLatest([...orders]);
    const pendingOrders = sortByLatest(
      orders.filter((order) => order.status === "PENDING")
    );
    const confirmedOrders = sortByLatest(
      orders.filter((order) => order.status === "CONFIRMED")
    );
    const paidOrders = sortByLatest(
      orders.filter((order) => order.status === "PAID")
    );
    const preparingOrders = sortByLatest(
      orders.filter((order) => order.status === "PREPARING")
    );
    const readyOrders = sortByLatest(
      orders.filter((order) => order.status === "READY")
    );
    const completedOrders = sortByLatest(
      orders.filter((order) => order.status === "COMPLETED")
    );

    return {
      all: allOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      paid: paidOrders,
      preparing: preparingOrders,
      ready: readyOrders,
      completed: completedOrders,
    };
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  const renderOrderCard = (order: any) => (
    <Card
      key={order.id}
      className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow"
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
                <DollarSign className="h-3 w-3" />
                {formatCurrency(Number(order.totalAmount))}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[order.status as OrderStatus]}>
              {order.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                alert(
                  `Order Details:\nID: ${order.id}\nNumber: ${
                    order.orderNumber
                  }\nStatus: ${order.status}\nCustomer: ${
                    order.customer?.name
                  }\nTotal: ${formatCurrency(Number(order.totalAmount))}`
                )
              }
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Order Items Preview */}
          <div>
            <h4 className="font-medium mb-1 text-sm">Items:</h4>
            <div className="space-y-1">
              {order.orderItems?.slice(0, 2).map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menuItem?.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(Number(item.totalPrice))}
                  </span>
                </div>
              ))}
              {order.orderItems?.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{order.orderItems.length - 2} more items
                </div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Notes:</strong> {order.notes}
            </div>
          )}

          {/* Order Timeline */}
          <div className="text-xs text-muted-foreground">
            Created: {new Date(order.createdAt).toLocaleString()}
            {order.updatedAt !== order.createdAt && (
              <span className="ml-2">
                • Updated: {new Date(order.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={["RECEPTION"]}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Reception Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Manage customers and create orders
                for the cafe.
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
                disabled={ordersLoading || customersLoading || statsLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    ordersLoading || customersLoading || statsLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    stats.totalCustomers
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Active customer base
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    stats.totalOrders
                  )}
                </div>
                <p className="text-xs text-green-600 mt-1">All time orders</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Today's Orders
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    stats.todayOrders
                  )}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Orders processed today
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Pending Orders
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">
                  {statsLoading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    stats.pendingOrders
                  )}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList className="grid w-fit grid-cols-2 bg-white shadow-sm border">
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Orders Management
                </TabsTrigger>
                <TabsTrigger
                  value="customers"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Customer Management
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </div>
            </div>

            {/* Orders Tab Content */}
            <TabsContent value="orders" className="space-y-6">
              {/* Order Status Tabs */}
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-fit grid-cols-7 bg-white shadow-sm border">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    All ({ordersByStatus.all.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Pending ({ordersByStatus.pending.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmed"
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Confirmed ({ordersByStatus.confirmed.length})
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Paid ({ordersByStatus.paid.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="preparing"
                    className="flex items-center gap-2"
                  >
                    <Coffee className="h-4 w-4" />
                    Preparing ({ordersByStatus.preparing.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="ready"
                    className="flex items-center gap-2"
                  >
                    <Timer className="h-4 w-4" />
                    Ready ({ordersByStatus.ready.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Completed ({ordersByStatus.completed.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        All Orders - Latest First
                      </CardTitle>
                      <CardDescription>
                        Complete list of all orders sorted by creation time
                        (latest first)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">Loading orders...</p>
                        </div>
                      ) : ordersByStatus.all.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No orders yet
                          </h3>
                          <p className="text-gray-500">
                            Create your first order to get started
                          </p>
                          <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="mt-4"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Order
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.all.map(renderOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Pending Orders - Awaiting Confirmation
                      </CardTitle>
                      <CardDescription>
                        Orders that need to be confirmed by cashier
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.pending.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No pending orders
                          </h3>
                          <p className="text-gray-500">
                            All orders have been processed
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.pending.map(renderOrderCard)}
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
                        Orders confirmed and awaiting payment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.confirmed.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No confirmed orders
                          </h3>
                          <p className="text-gray-500">
                            Orders will appear here after confirmation
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.confirmed.map(renderOrderCard)}
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
                        Paid Orders - Sent to Kitchen
                      </CardTitle>
                      <CardDescription>
                        Orders with completed payments, sent to kitchen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.paid.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No paid orders
                          </h3>
                          <p className="text-gray-500">
                            Paid orders will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.paid.map(renderOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preparing" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-orange-600" />
                        Preparing Orders - In Kitchen
                      </CardTitle>
                      <CardDescription>
                        Orders currently being prepared by kitchen staff
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.preparing.length === 0 ? (
                        <div className="text-center py-8">
                          <Coffee className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No orders in preparation
                          </h3>
                          <p className="text-gray-500">
                            Orders being prepared will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.preparing.map(renderOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ready" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-purple-600" />
                        Ready Orders - Awaiting Pickup
                      </CardTitle>
                      <CardDescription>
                        Orders ready for customer pickup or delivery
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.ready.length === 0 ? (
                        <div className="text-center py-8">
                          <Timer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No orders ready
                          </h3>
                          <p className="text-gray-500">
                            Ready orders will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.ready.map(renderOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-gray-600" />
                        Completed Orders - Delivered
                      </CardTitle>
                      <CardDescription>
                        Orders that have been completed and delivered to
                        customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersByStatus.completed.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No completed orders
                          </h3>
                          <p className="text-gray-500">
                            Completed orders will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {ordersByStatus.completed.map(renderOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Customers Tab Content */}
            <TabsContent value="customers" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Customer Management
                  </CardTitle>
                  <CardDescription>
                    Manage your customer database, add new customers, and view
                    customer details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomerList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <CreateOrderDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onOrderCreated={handleOrderCreated}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
