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
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";
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
  const { orders, loading: ordersLoading, refreshData, lastUpdate, isConnected } = usePollingData();
  const [activeTab, setActiveTab] = useState<"overview" | "menu">("overview");
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
                <RefreshCw className={`mr-2 h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Link href="/dashboard/chef/kitchen">
              <Button variant="outline">
                <ChefHat className="mr-2 h-4 w-4" />
                Kitchen Orders
              </Button>
            </Link>
            <Button
              variant={activeTab === "menu" ? "default" : "outline"}
              onClick={() => setActiveTab("menu")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Items
            </Button>
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className={`${ordersLoading ? 'opacity-75' : ''} transition-opacity`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      New Orders
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {ordersLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {orderStats.newOrders}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready to prepare
                    </p>
                  </CardContent>
                </Card>

                <Card className={`${ordersLoading ? 'opacity-75' : ''} transition-opacity`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Preparing
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {ordersLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {orderStats.preparing}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently cooking
                    </p>
                  </CardContent>
                </Card>

                <Card className={`${ordersLoading ? 'opacity-75' : ''} transition-opacity`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ready</CardTitle>
                    <div className="flex items-center gap-1">
                      {ordersLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orderStats.ready}</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting pickup
                    </p>
                  </CardContent>
                </Card>

                <Card className={`${ordersLoading ? 'opacity-75' : ''} transition-opacity`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed Today
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {ordersLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {orderStats.completedToday}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Orders finished
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Polling Status Card */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Real-time Updates
                  </CardTitle>
                  <CardDescription>
                    System automatically polls for new orders every 30 seconds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Connection Status:</span>
                        <div className="flex items-center gap-1">
                          {isConnected ? (
                            <>
                              <Wifi className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">Connected</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-orange-600">Polling Mode</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Update Frequency:</span>
                        <span className="text-sm text-muted-foreground">Every 30 seconds</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Update:</span>
                        <span className="text-sm text-muted-foreground">
                          {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Orders:</span>
                        <span className="text-sm font-semibold">{orders.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kitchen Orders:</span>
                        <span className="text-sm font-semibold">
                          {orders.filter(o => ['PAID', 'PREPARING', 'READY'].includes(o.status)).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span className={`text-sm font-semibold ${ordersLoading ? 'text-blue-600' : 'text-green-600'}`}>
                          {ordersLoading ? 'Updating...' : 'Up to date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Polling automatically fetches new orders from reception and cashier
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshData}
                        disabled={ordersLoading}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                        Refresh Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks you can perform from here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/dashboard/chef/kitchen">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 w-full"
                      >
                        <ChefHat className="h-6 w-6" />
                        <span className="text-sm">Kitchen Orders</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => setActiveTab("menu")}
                    >
                      <Plus className="h-6 w-6" />
                      <span className="text-sm">Add Menu Items</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      disabled
                    >
                      <Coffee className="h-6 w-6" />
                      <span className="text-sm">Inventory</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Menu Management Tab */}
          {activeTab === "menu" && (
            <div className="grid gap-8 md:grid-cols-2">
              {/* Add Menu Item Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
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

              {/* Kitchen Features Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChefHat className="mr-2 h-5 w-5" />
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
