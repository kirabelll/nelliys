"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleGuard from "@/components/common/RoleGuard";
import { apiClient } from "@/lib/api-client";
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  Eye, 
  Edit, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchCustomers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const response = await apiClient.getCustomers({
        page,
        limit: pagination.limit,
        search: search || undefined,
      });
      
      setCustomers(response.customers || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, searchQuery);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage, searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    fetchCustomers(1, "");
  };

  return (
    <RoleGuard allowedRoles={["RECEPTION"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">
                Manage your customer database and view customer details
              </p>
            </div>
            <Link href="/dashboard/reception/customers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </Link>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Customers</CardTitle>
              <CardDescription>
                Find customers by name, phone number, or email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search customers by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
                {searchQuery && (
                  <Button type="button" variant="outline" onClick={clearSearch}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Customers List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                {pagination.total > 0 
                  ? `Showing ${customers.length} of ${pagination.total} customers`
                  : "No customers found"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : customers.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact Information</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src="" />
                                <AvatarFallback>
                                  {customer.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="mr-2 h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="mr-2 h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {customer._count?.orders || 0} orders
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link href={`/dashboard/reception/customers/${customer.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/dashboard/reception/customers/${customer.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">
                            Page {pagination.page} of {pagination.pages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">No customers found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search terms or clear the search to see all customers." 
                      : "Get started by adding your first customer to the system."
                    }
                  </p>
                  {!searchQuery && (
                    <div className="mt-6">
                      <Link href="/dashboard/reception/customers/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Customer
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}