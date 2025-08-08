"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleGuard from "@/components/common/RoleGuard";
import { apiClient } from "@/lib/api-client";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  Eye,
  Filter,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get URL parameters
  const currentPage = parseInt(searchParams.get("page") || "1");
  const selectedStatus = searchParams.get("status") || "all";
  
  const [pagination, setPagination] = useState({
    page: currentPage,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const updateURL = (page: number, status: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (status !== "all") params.set("status", status);
    
    const queryString = params.toString();
    const newURL = queryString ? `?${queryString}` : "";
    router.push(`/dashboard/reception/orders${newURL}`);
  };

  const fetchOrders = async (page = 1, status?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getOrders({
        page,
        limit: pagination.limit,
        status: status === "all" ? undefined : status,
      });

      setOrders(response.orders || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, selectedStatus);
  }, [currentPage, selectedStatus]);

  const handlePageChange = (newPage: number) => {
    updateURL(newPage, selectedStatus);
  };

  const handleStatusChange = (status: string) => {
    updateURL(1, status); // Reset to page 1 when changing status
  };

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PAID", label: "Paid" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY", label: "Ready" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track their status
          </p>
        </div>
        <Link href="/dashboard/reception/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

          {/* Status Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filter Orders
              </CardTitle>
              <CardDescription>
                Filter orders by their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      selectedStatus === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStatusChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Order List</CardTitle>
              <CardDescription>
                {pagination.total > 0
                  ? `Showing ${orders.length} of ${pagination.total} orders`
                  : "No orders found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {order.customer?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.customer?.phone || order.customer?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.orderItems
                                ?.slice(0, 2)
                                .map((item, index) => (
                                  <div key={index}>
                                    {item.quantity}x {item.menuItem?.name}
                                  </div>
                                ))}
                              {(order.orderItems?.length || 0) > 2 && (
                                <div className="text-muted-foreground">
                                  +{(order.orderItems?.length || 0) - 2} more
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ${order.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                statusColors[
                                  order.status as keyof typeof statusColors
                                ]
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/dashboard/reception/orders/${order.id}`}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1}{" "}
                        to{" "}
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )}{" "}
                        of {pagination.total} results
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page > 1) {
                                  handlePageChange(pagination.page - 1);
                                }
                              }}
                              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {/* Page Numbers */}
                          {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                              pageNum = pagination.pages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(pageNum);
                                  }}
                                  isActive={pageNum === pagination.page}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page < pagination.pages) {
                                  handlePageChange(pagination.page + 1);
                                }
                              }}
                              className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">
                    No orders found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedStatus === "all"
                      ? "Get started by creating your first order."
                      : `No orders with status "${selectedStatus}" found.`}
                  </p>
                  {selectedStatus === "all" && (
                    <div className="mt-6">
                      <Link href="/dashboard/reception/orders/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Order
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  );
}

export default function OrdersPage() {
  return (
    <RoleGuard allowedRoles={["RECEPTION"]}>
      <DashboardLayout>
        <Suspense fallback={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground">
                  Loading orders...
                </p>
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        }>
          <OrdersContent />
        </Suspense>
      </DashboardLayout>
    </RoleGuard>
  );
}
