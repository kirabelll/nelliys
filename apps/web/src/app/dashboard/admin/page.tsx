"use client";

import ProtectedRoute from "@/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Users,
  ChefHat,
  CreditCard,
  Coffee,
  ShoppingCart,
  BarChart3,
  UserCheck,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  LogOut,
  Activity,
  Target,
  Star,
  Award,
  RefreshCw,
  Zap,
  Eye,
} from "lucide-react";

interface AnalyticsOverview {
  overview: {
    totalUsers: number;
    totalCustomers: number;
    totalMenuItems: number;
    totalOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: { name: string };
    payment?: { status: string };
  }>;
}

interface RevenueData {
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface MenuPerformance {
  topItems: Array<{
    id: string;
    name: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  categoryPerformance: Record<
    string,
    {
      category: string;
      totalRevenue: number;
      totalQuantity: number;
      itemCount: number;
    }
  >;
}

interface CustomerInsights {
  customerSegments: {
    new: number;
    returning: number;
    loyal: number;
  };
  newCustomersThisMonth: number;
  customerRetention: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    orderCount: number;
    totalSpent: number;
  }>;
  totalCustomers: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const [analyticsOverview, setAnalyticsOverview] =
    useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [menuPerformance, setMenuPerformance] =
    useState<MenuPerformance | null>(null);
  const [customerInsights, setCustomerInsights] =
    useState<CustomerInsights | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      // Load all analytics data in parallel
      const [
        overviewResponse,
        revenueResponse,
        menuResponse,
        customerResponse,
      ] = await Promise.all([
        apiRequest("/api/analytics/overview"),
        apiRequest(`/api/analytics/revenue?period=${revenuePeriod}`),
        apiRequest("/api/analytics/menu-performance"),
        apiRequest("/api/analytics/customer-insights"),
      ]);

      if (overviewResponse.ok) {
        const data = await overviewResponse.json();
        console.log("Overview data:", data);
        setAnalyticsOverview(data);
      } else {
        console.error(
          "Overview response error:",
          overviewResponse.status,
          await overviewResponse.text()
        );
      }

      if (revenueResponse.ok) {
        const data = await revenueResponse.json();
        console.log("Revenue data:", data);
        setRevenueData(data);
      } else {
        console.error(
          "Revenue response error:",
          revenueResponse.status,
          await revenueResponse.text()
        );
      }

      if (menuResponse.ok) {
        const data = await menuResponse.json();
        console.log("Menu performance data:", data);
        setMenuPerformance(data);
      } else {
        console.error(
          "Menu response error:",
          menuResponse.status,
          await menuResponse.text()
        );
      }

      if (customerResponse.ok) {
        const data = await customerResponse.json();
        console.log("Customer insights data:", data);
        setCustomerInsights(data);
      } else {
        console.error(
          "Customer response error:",
          customerResponse.status,
          await customerResponse.text()
        );
      }

      if (isRefreshing && !isLoading) {
        toast.success("Dashboard data refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [revenuePeriod]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "CHEF":
        return "bg-orange-100 text-orange-800";
      case "CASHIER":
        return "bg-green-100 text-green-800";
      case "RECEPTION":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PREPARING":
        return "bg-blue-100 text-blue-800";
      case "READY":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "24h":
        return "Last 24 Hours";
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      default:
        return "Selected Period";
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">
              Loading comprehensive analytics...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Welcome back, {user?.name}! Here's your comprehensive business
                overview.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Real-time data
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await apiRequest("/api/seed/check-data");
                    if (response.ok) {
                      const data = await response.json();
                      console.log("Database check:", data);
                      toast.success(
                        `Found ${data.summary.completedPayments} payments, Revenue: ${data.summary.totalRevenue}`
                      );
                    } else {
                      toast.error("Failed to check data");
                    }
                  } catch (error) {
                    toast.error("Error checking data");
                  }
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Check Data
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Enhanced Overview Stats */}
          {analyticsOverview && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Total Revenue
                  </CardTitle>
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {formatCurrency(analyticsOverview.overview.totalRevenue)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Today:{" "}
                    {formatCurrency(analyticsOverview.overview.todayRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Total Orders
                  </CardTitle>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">
                    {analyticsOverview.overview.totalOrders}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Today: {analyticsOverview.overview.todayOrders} orders
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">
                    Total Customers
                  </CardTitle>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800">
                    {analyticsOverview.overview.totalCustomers}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Registered customers
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">
                    Staff Members
                  </CardTitle>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800">
                    {analyticsOverview.overview.totalUsers}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    {analyticsOverview.overview.totalMenuItems} menu items
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Tabbed Interface */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Menu Performance
              </TabsTrigger>
              <TabsTrigger
                value="customers"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Enhanced Staff Distribution Pie Chart */}
                {analyticsOverview && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Staff Distribution
                      </CardTitle>
                      <CardDescription>
                        Distribution of staff by roles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsOverview.usersByRole.map(
                              (item, index) => ({
                                name: item.role.replace("_", " "),
                                value: item.count,
                                fill: COLORS[index % COLORS.length],
                              })
                            )}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${
                                percent ? (percent * 100).toFixed(0) : 0
                              }%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsOverview.usersByRole.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Order Status Distribution */}
                {analyticsOverview && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Order Status Distribution
                      </CardTitle>
                      <CardDescription>
                        Current orders by status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsOverview.ordersByStatus.map(
                              (item, index) => ({
                                name: item.status,
                                value: item.count,
                                fill: COLORS[index % COLORS.length],
                              })
                            )}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${
                                percent ? (percent * 100).toFixed(0) : 0
                              }%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analyticsOverview.ordersByStatus.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Enhanced Recent Orders Table */}
              {analyticsOverview && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>
                      Latest orders in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsOverview.recentOrders
                          .slice(0, 10)
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                {order.orderNumber}
                              </TableCell>
                              <TableCell>{order.customer.name}</TableCell>
                              <TableCell>
                                {formatCurrency(order.totalAmount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getStatusBadgeColor(order.status)}
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    order.payment?.status === "COMPLETED"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {order.payment?.status || "PENDING"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Revenue Analytics
                  </h3>
                  <p className="text-gray-600">
                    Track revenue trends over time
                  </p>
                </div>
                <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {revenueData ? (
                <>
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">
                          Revenue ({getPeriodLabel(revenueData.period)})
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-800">
                          {formatCurrency(revenueData.totalRevenue)}
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {revenueData.totalOrders > 0
                            ? `${revenueData.totalOrders} completed orders`
                            : "No completed orders"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">
                          Orders ({getPeriodLabel(revenueData.period)})
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-800">
                          {revenueData.totalOrders}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Completed orders only
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">
                          Avg Order Value
                        </CardTitle>
                        <Target className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-800">
                          {formatCurrency(revenueData.averageOrderValue)}
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          {revenueData.totalOrders > 0
                            ? "Per completed order"
                            : "No data available"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Revenue Trend - {getPeriodLabel(revenueData.period)}
                      </CardTitle>
                      <CardDescription>
                        Daily revenue and order count for completed orders
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={revenueData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString()
                            }
                          />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            labelFormatter={(value) =>
                              new Date(value).toLocaleDateString()
                            }
                            formatter={(value, name) => [
                              name === "Revenue ($)"
                                ? formatCurrency(Number(value))
                                : value,
                              name,
                            ]}
                          />
                          <Legend />
                          <Bar
                            yAxisId="right"
                            dataKey="orders"
                            fill="#8884d8"
                            name="Orders"
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#82ca9d"
                            strokeWidth={3}
                            name="Revenue ($)"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-2">
                        No revenue data available
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Revenue data will appear here once orders with payments
                        are processed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              {menuPerformance ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-orange-600" />
                          Category Performance
                        </CardTitle>
                        <CardDescription>
                          Revenue by menu category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={Object.values(
                              menuPerformance.categoryPerformance
                            )}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalRevenue" fill="#f97316" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-600" />
                          Top Menu Items
                        </CardTitle>
                        <CardDescription>
                          Best performing items by revenue
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {menuPerformance.topItems
                            .slice(0, 5)
                            .map((item, index) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-4"
                              >
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.category}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {formatCurrency(item.totalRevenue)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.totalQuantity} sold
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-brown-600" />
                        All Menu Items Performance
                      </CardTitle>
                      <CardDescription>
                        Complete performance breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity Sold</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Orders</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuPerformance.topItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.totalQuantity}</TableCell>
                              <TableCell>
                                {formatCurrency(item.totalRevenue)}
                              </TableCell>
                              <TableCell>{item.orderCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-2">
                        No menu performance data available
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Menu performance data will appear here once orders are
                        placed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              {customerInsights ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Customer Segments
                        </CardTitle>
                        <CardDescription>
                          Customer distribution by loyalty
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "New Customers",
                                  value: customerInsights.customerSegments.new,
                                  fill: COLORS[0],
                                },
                                {
                                  name: "Returning Customers",
                                  value:
                                    customerInsights.customerSegments.returning,
                                  fill: COLORS[1],
                                },
                                {
                                  name: "Loyal Customers",
                                  value:
                                    customerInsights.customerSegments.loyal,
                                  fill: COLORS[2],
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name} ${
                                  percent ? (percent * 100).toFixed(0) : 0
                                }%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[0, 1, 2].map((index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          Customer Metrics
                        </CardTitle>
                        <CardDescription>
                          Key customer statistics
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Customers
                            </p>
                            <p className="text-3xl font-bold text-blue-800">
                              {customerInsights.totalCustomers}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              New This Month
                            </p>
                            <p className="text-3xl font-bold text-green-800">
                              {customerInsights.newCustomersThisMonth}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-purple-100 rounded-full">
                            <Activity className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Active Customers
                            </p>
                            <p className="text-3xl font-bold text-purple-800">
                              {customerInsights.customerRetention}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        Top Customers
                      </CardTitle>
                      <CardDescription>
                        Highest spending customers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Total Spent</TableHead>
                            <TableHead>Avg Order</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerInsights.topCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium">
                                {customer.name}
                              </TableCell>
                              <TableCell>
                                {customer.email || customer.phone || "N/A"}
                              </TableCell>
                              <TableCell>{customer.orderCount}</TableCell>
                              <TableCell>
                                {formatCurrency(customer.totalSpent)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  customer.totalSpent / customer.orderCount
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-2">
                        No customer data available
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Customer insights will appear here once customers place
                        orders
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
