"use client";

import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { usePollingData } from "@/hooks/usePollingData";
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  LogOut,
  Plus,
  Coffee,
  RefreshCw,
  Wifi,
  WifiOff,
  Timer,
  Package,
  Activity,
  User,
  DollarSign,
  Eye,
} from "lucide-react";
import type { OrderStatus } from "@/types";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description?: string;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function ChefDashboard() {
  const { user, logout } = useAuth();
  const {
    orders,
    loading: ordersLoading,
    refreshData,
    lastUpdate,
    isConnected,
  } = usePollingData();
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiRequest("/api/categories");
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        } else {
          console.error("Failed to load categories");
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Error loading categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Attempting to add menu item:", newMenuItem);

      const response = await apiRequest("/api/menu-items", {
        method: "POST",
        body: JSON.stringify({
          name: newMenuItem.name,
          description: newMenuItem.description,
          price: parseFloat(newMenuItem.price),
          categoryId: newMenuItem.categoryId,
        }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Menu item added:", result);
        toast.success("Menu item added successfully!");
        setNewMenuItem({
          name: "",
          description: "",
          price: "",
          categoryId: "",
        });
      } else {
        const error = await response.json();
        console.error("API error:", error);
        toast.error(error.error || "Failed to add menu item");
      }
    } catch (error) {
      console.error("Error adding menu item:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats for the dashboard
  const orderStats = {
    newOrders: orders.filter((order) => order.status === "PAID").length,
    preparing: orders.filter((order) => order.status === "PREPARING").length,
    ready: orders.filter((order) => order.status === "READY").length,
    completedToday: orders.filter((order) => {
      const today = new Date().toDateString();
      return (
        order.status === "COMPLETED" &&
        new Date(order.createdAt).toDateString() === today
      );
    }).length,
  };

  // Filter kitchen orders (PAID, PREPARING, READY)
  const kitchenOrders = orders.filter((order) =>
    ["PAID", "PREPARING", "READY"].includes(order.status)
  );

  // Group kitchen orders by status
  const kitchenOrdersByStatus = {
    paid: kitchenOrders.filter((order) => order.status === "PAID"),
    preparing: kitchenOrders.filter((order) => order.status === "PREPARING"),
    ready: kitchenOrders.filter((order) => order.status === "READY"),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  // Handle order status updates
  const handleOrderStatusUpdate = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        refreshData(); // Refresh the orders data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Network error. Please try again.");
    }
  };

  // Render kitchen order card
  const renderKitchenOrderCard = (order: any) => (
    <Card
      key={order.id}
      className="border-l-4 border-l-orange-400 hover:shadow-md transition-shadow"
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
        <div className="space-y-3">
          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Items to Prepare:</h4>
            <div className="space-y-1">
              {order.orderItems?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium">
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
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Special Instructions:</strong> {order.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {order.status === "PAID" && (
              <Button
                size="sm"
                onClick={() => handleOrderStatusUpdate(order.id, "PREPARING")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <ChefHat className="h-3 w-3 mr-1" />
                Start Preparing
              </Button>
            )}
            {order.status === "PREPARING" && (
              <Button
                size="sm"
                onClick={() => handleOrderStatusUpdate(order.id, "READY")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark as Ready
              </Button>
            )}
            {order.status === "READY" && (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Ready for Pickup</span>
              </div>
            )}
          </div>

          {/* Order Timeline */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
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
    <ProtectedRoute allowedRoles={["CHEF"]}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Chef Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Welcome back, Chef {user?.name}! Manage kitchen operations and
                  menu items.
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
              className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 ${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  New Orders
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">
                  {orderStats.newOrders}
                </div>
                <p className="text-xs text-blue-600 mt-1">Ready to prepare</p>
              </CardContent>
            </Card>

            <Card
              className={`border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 ${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Preparing
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <ChefHat className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800">
                  {orderStats.preparing}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Currently cooking
                </p>
              </CardContent>
            </Card>

            <Card
              className={`border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 ${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Ready
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">
                  {orderStats.ready}
                </div>
                <p className="text-xs text-purple-600 mt-1">Awaiting pickup</p>
              </CardContent>
            </Card>

            <Card
              className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 ${
                ordersLoading ? "opacity-75" : ""
              } transition-opacity`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Completed Today
                </CardTitle>
                <div className="flex items-center gap-1">
                  {ordersLoading && (
                    <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  {orderStats.completedToday}
                </div>
                <p className="text-xs text-green-600 mt-1">Orders finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList className="grid w-fit grid-cols-4 bg-white shadow-sm border">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="kitchen"
                  className="flex items-center gap-2"
                >
                  <ChefHat className="h-4 w-4" />
                  Kitchen Orders
                </TabsTrigger>
                <TabsTrigger value="menu" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Menu Items
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
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
              </div>
            </div>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Real-time Kitchen Status
                  </CardTitle>
                  <CardDescription>
                    System automatically polls for new orders every 30 seconds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Connection Status:
                        </span>
                        <div className="flex items-center gap-1">
                          {isConnected ? (
                            <>
                              <Wifi className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">
                                Connected
                              </span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-orange-600">
                                Polling Mode
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Update Frequency:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Every 30 seconds
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Last Update:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Total Orders:
                        </span>
                        <span className="text-sm font-semibold">
                          {orders.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Kitchen Orders:
                        </span>
                        <span className="text-sm font-semibold">
                          {
                            orders.filter((o) =>
                              ["PAID", "PREPARING", "READY"].includes(o.status)
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span
                          className={`text-sm font-semibold ${
                            ordersLoading ? "text-blue-600" : "text-green-600"
                          }`}
                        >
                          {ordersLoading ? "Updating..." : "Up to date"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-blue-600" />
                    Kitchen Features
                  </CardTitle>
                  <CardDescription>
                    Your complete kitchen management center
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800">
                        ✅ Kitchen Operations Active!
                      </h3>
                      <p className="text-green-700 mt-1">
                        You can now manage orders and track food preparation
                        status.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Available Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>✅ Add new menu items</li>
                          <li>✅ Manage food preparation</li>
                          <li>✅ Track order status</li>
                          <li>✅ Mark food as ready to serve</li>
                          <li>✅ Kitchen inventory management</li>
                          <li>✅ Real-time order updates</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Order Workflow</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              PAID
                            </Badge>
                            <span className="text-muted-foreground">
                              → Ready to start cooking
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-800">
                              PREPARING
                            </Badge>
                            <span className="text-muted-foreground">
                              → Currently cooking
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800">
                              READY
                            </Badge>
                            <span className="text-muted-foreground">
                              → Ready to serve
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kitchen Orders Tab Content */}
            <TabsContent value="kitchen" className="space-y-6">
              {/* Kitchen Order Status Tabs */}
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-fit grid-cols-4 bg-white shadow-sm border">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    All Kitchen ({kitchenOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="paid" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    New Orders ({kitchenOrdersByStatus.paid.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="preparing"
                    className="flex items-center gap-2"
                  >
                    <ChefHat className="h-4 w-4" />
                    Preparing ({kitchenOrdersByStatus.preparing.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="ready"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Ready ({kitchenOrdersByStatus.ready.length})
                  </TabsTrigger>
                </TabsList>

                {/* All Kitchen Orders */}
                <TabsContent value="all" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        All Kitchen Orders
                      </CardTitle>
                      <CardDescription>
                        All orders that need kitchen attention - sorted by
                        creation time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="text-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">
                            Loading kitchen orders...
                          </p>
                        </div>
                      ) : kitchenOrders.length === 0 ? (
                        <div className="text-center py-8">
                          <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No kitchen orders
                          </h3>
                          <p className="text-gray-500">
                            Orders will appear here when they're ready for
                            preparation
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {kitchenOrders.map(renderKitchenOrderCard)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* New Orders (PAID) */}
                <TabsContent value="paid" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        New Orders - Ready to Start
                      </CardTitle>
                      <CardDescription>
                        Orders that have been paid and are ready for preparation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {kitchenOrdersByStatus.paid.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No new orders
                          </h3>
                          <p className="text-gray-500">
                            New paid orders will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {kitchenOrdersByStatus.paid.map(
                            renderKitchenOrderCard
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preparing Orders */}
                <TabsContent value="preparing" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-orange-600" />
                        Orders Being Prepared
                      </CardTitle>
                      <CardDescription>
                        Orders currently being prepared in the kitchen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {kitchenOrdersByStatus.preparing.length === 0 ? (
                        <div className="text-center py-8">
                          <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No orders in preparation
                          </h3>
                          <p className="text-gray-500">
                            Orders being prepared will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {kitchenOrdersByStatus.preparing.map(
                            renderKitchenOrderCard
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Ready Orders */}
                <TabsContent value="ready" className="space-y-4">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        Orders Ready for Pickup
                      </CardTitle>
                      <CardDescription>
                        Orders that are ready to be served to customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {kitchenOrdersByStatus.ready.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-600">
                            No orders ready
                          </h3>
                          <p className="text-gray-500">
                            Ready orders will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {kitchenOrdersByStatus.ready.map(
                            renderKitchenOrderCard
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Menu Management Tab Content */}
            <TabsContent value="menu" className="space-y-6">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-blue-600" />
                      Add New Menu Item
                    </CardTitle>
                    <CardDescription>
                      Create new dishes and beverages for the menu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddMenuItem} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                          id="name"
                          value={newMenuItem.name}
                          onChange={(e) =>
                            setNewMenuItem({
                              ...newMenuItem,
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Grilled Chicken Sandwich"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newMenuItem.description}
                          onChange={(e) =>
                            setNewMenuItem({
                              ...newMenuItem,
                              description: e.target.value,
                            })
                          }
                          placeholder="Brief description of the item"
                        />
                      </div>

                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newMenuItem.price}
                          onChange={(e) =>
                            setNewMenuItem({
                              ...newMenuItem,
                              price: e.target.value,
                            })
                          }
                          placeholder="9.99"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={newMenuItem.categoryId}
                          onChange={(e) =>
                            setNewMenuItem({
                              ...newMenuItem,
                              categoryId: e.target.value,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                          disabled={isLoadingCategories}
                        >
                          <option value="">
                            {isLoadingCategories
                              ? "Loading categories..."
                              : "Select Category"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {categories.length === 0 && !isLoadingCategories
                            ? "No categories available. Please run the seed script."
                            : "Choose the appropriate category for your menu item"}
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Adding..." : "Add Menu Item"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coffee className="h-5 w-5 text-blue-600" />
                      Menu Management Tips
                    </CardTitle>
                    <CardDescription>
                      Best practices for managing your menu items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">
                          💡 Pro Tips
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>
                            • Use descriptive names that customers will
                            understand
                          </li>
                          <li>• Include key ingredients in descriptions</li>
                          <li>
                            • Price competitively based on ingredients cost
                          </li>
                          <li>• Organize items into appropriate categories</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">
                          Categories Available
                        </h4>
                        {isLoadingCategories ? (
                          <p className="text-sm text-muted-foreground">
                            Loading categories...
                          </p>
                        ) : categories.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <Badge key={category.id} variant="outline">
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No categories found. Please contact admin to set up
                            categories.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inventory Tab Content */}
            <TabsContent value="inventory" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Kitchen Inventory Management
                  </CardTitle>
                  <CardDescription>
                    Track ingredients, supplies, and kitchen equipment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-600">
                      Inventory System Coming Soon
                    </h3>
                    <p className="text-gray-500 mb-4">
                      This feature will help you track ingredients, supplies,
                      and equipment
                    </p>
                    <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
                      <div className="p-4 border rounded-lg">
                        <Timer className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <h4 className="font-medium">Ingredient Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Monitor stock levels
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <h4 className="font-medium">Low Stock Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when running low
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <h4 className="font-medium">Supply Orders</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage supplier orders
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
