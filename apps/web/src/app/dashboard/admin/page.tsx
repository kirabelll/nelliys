"use client";

import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
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
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalMenuItems: number;
  totalOrders: number;
  todayRevenue: number;
  activeUsers: {
    reception: number;
    chef: number;
    cashier: number;
    superAdmin: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCustomers: 0,
    totalMenuItems: 0,
    totalOrders: 0,
    todayRevenue: 0,
    activeUsers: {
      reception: 0,
      chef: 0,
      cashier: 0,
      superAdmin: 0,
    },
  });
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load all data in parallel
        const [usersResponse, customersResponse, menuItemsResponse] = await Promise.all([
          apiRequest('/api/users'),
          apiRequest('/api/customers'),
          apiRequest('/api/menu-items'),
        ]);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
          
          // Calculate user role counts
          const roleCounts = usersData.reduce((acc: any, user: User) => {
            const role = user.role.toLowerCase();
            if (role === 'super_admin') {
              acc.superAdmin++;
            } else {
              acc[role] = (acc[role] || 0) + 1;
            }
            return acc;
          }, { reception: 0, chef: 0, cashier: 0, superAdmin: 0 });

          setStats(prev => ({
            ...prev,
            totalUsers: usersData.length,
            activeUsers: roleCounts,
          }));
        }

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          const customersList = customersData.customers || customersData;
          setCustomers(customersList);
          setStats(prev => ({
            ...prev,
            totalCustomers: customersList.length,
          }));
        }

        if (menuItemsResponse.ok) {
          const menuItemsData = await menuItemsResponse.json();
          setStats(prev => ({
            ...prev,
            totalMenuItems: menuItemsData.length,
          }));
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'CHEF':
        return 'bg-orange-100 text-orange-800';
      case 'CASHIER':
        return 'bg-green-100 text-green-800';
      case 'RECEPTION':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}! Here's an overview of your cafe management system.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    All system users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered customers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
                  <p className="text-xs text-muted-foreground">
                    Available items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    All time orders
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Roles Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Overview</CardTitle>
                <CardDescription>
                  Current staff distribution by roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Reception</p>
                      <p className="text-2xl font-bold">{stats.activeUsers.reception}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChefHat className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Chefs</p>
                      <p className="text-2xl font-bold">{stats.activeUsers.chef}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Cashiers</p>
                      <p className="text-2xl font-bold">{stats.activeUsers.cashier}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Super Admins</p>
                      <p className="text-2xl font-bold">{stats.activeUsers.superAdmin}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Users and Customers */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>
                    Latest registered system users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Customers</CardTitle>
                  <CardDescription>
                    Latest registered customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customers.slice(0, 5).map((customer) => (
                      <div key={customer.id} className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {customer.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email || customer.phone || 'No contact info'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          Customer
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system health and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">System Status</p>
                      <p className="text-sm text-green-600">All systems operational</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Data Integrity</p>
                      <p className="text-sm text-green-600">100% healthy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}