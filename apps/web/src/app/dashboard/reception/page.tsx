"use client";

import { useState } from "react";
import { usePollingData as useRealTimeData } from "@/hooks/usePollingData";
import { RealTimeIndicator } from "@/components/ui/real-time-indicator";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerList } from "@/components/customers/customer-list";
import { OrderList } from "@/components/orders/order-list";
import { MenuManagement } from "@/components/menu/menu-management";
import {
  Users,
  Coffee,
  ShoppingCart,
  LogOut,
  UserPlus,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";

export default function ReceptionDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "customers" | "orders" | "menu"
  >("overview");
  const {
    stats,
    loading: dataLoading,
    isConnected,
    lastUpdate,
    refreshData,
  } = useRealTimeData();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <ProtectedRoute allowedRoles={["RECEPTION"]}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Reception Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Welcome back, {user?.name}! Manage customers and create orders
                  for the cafe.
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
                disabled={dataLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    dataLoading ? "animate-spin" : ""
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

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "customers" ? "default" : "outline"}
              onClick={() => setActiveTab("customers")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Customers
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "outline"}
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders
            </Button>
            <Button
              variant={activeTab === "menu" ? "default" : "outline"}
              onClick={() => setActiveTab("menu")}
            >
              <Coffee className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card
                  className={`${
                    dataLoading ? "opacity-75" : ""
                  } transition-opacity`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Customers
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {dataLoading && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dataLoading ? "..." : stats.totalCustomers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active customer base
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`${
                    dataLoading ? "opacity-75" : ""
                  } transition-opacity`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Menu Items
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {dataLoading && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dataLoading ? "..." : stats.totalMenuItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available for ordering
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`${
                    dataLoading ? "opacity-75" : ""
                  } transition-opacity`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Orders
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {dataLoading && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dataLoading ? "..." : stats.todaysOrders}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Orders processed today
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Polling Status Card */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Real-time Updates
                  </CardTitle>
                  <CardDescription>
                    System automatically polls for new data every 30 seconds
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
                          Total Customers:
                        </span>
                        <span className="text-sm font-semibold">
                          {stats.totalCustomers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Menu Items:</span>
                        <span className="text-sm font-semibold">
                          {stats.totalMenuItems}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <span
                          className={`text-sm font-semibold ${
                            dataLoading ? "text-blue-600" : "text-green-600"
                          }`}
                        >
                          {dataLoading ? "Updating..." : "Up to date"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Polling automatically fetches customer, menu, and order
                        data
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={dataLoading}
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${
                            dataLoading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Welcome Message */}
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to the Cafe Management System</CardTitle>
                  <CardDescription>
                    Your authentication is working perfectly! You're logged in
                    as a Reception user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800">
                        ✅ Authentication Success!
                      </h3>
                      <p className="text-green-700 mt-1">
                        You have successfully signed in and can access the
                        reception dashboard.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">User Information</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>
                            <strong>Name:</strong> {user?.name}
                          </li>
                          <li>
                            <strong>Email:</strong> {user?.email}
                          </li>
                          <li>
                            <strong>Role:</strong> {user?.role}
                          </li>
                          <li>
                            <strong>ID:</strong> {user?.id}
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Available Features</h4>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Customer management system</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Order creation and tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Menu item management</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="text-muted-foreground">
                              Reporting dashboard (Coming Soon)
                            </span>
                          </li>
                        </ul>
                      </div>
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
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => setActiveTab("customers")}
                    >
                      <UserPlus className="h-6 w-6" />
                      <span className="text-sm">Manage Customers</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => setActiveTab("orders")}
                    >
                      <ShoppingCart className="h-6 w-6" />
                      <span className="text-sm">Create Order</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => setActiveTab("menu")}
                    >
                      <Coffee className="h-6 w-6" />
                      <span className="text-sm">Manage Menu</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      disabled
                    >
                      <Users className="h-6 w-6" />
                      <span className="text-sm">View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Customer Management Tab */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Customer Management
                </h2>
                <p className="text-muted-foreground">
                  Manage your customer database, add new customers, and view
                  customer details.
                </p>
              </div>
              <CustomerList />
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Order Management
                </h2>
                <p className="text-muted-foreground">
                  Create and manage customer orders, track order status and
                  history.
                </p>
              </div>
              <OrderList />
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Menu Management
                </h2>
                <p className="text-muted-foreground">
                  Manage menu items, categories, and pricing for your cafe.
                </p>
              </div>
              <MenuManagement />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
