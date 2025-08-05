"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleGuard from "@/components/common/RoleGuard";
import { apiClient } from "@/lib/api-client";
import { Customer, MenuItem, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart,
  User,
  Coffee,
  Trash2
} from "lucide-react";

interface OrderItem {
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, menuItemsResponse, categoriesResponse] = await Promise.all([
          apiClient.getCustomers({ limit: 100 }),
          apiClient.getMenuItems(),
          apiClient.getCategories(),
        ]);

        setCustomers(customersResponse.customers || []);
        setMenuItems(menuItemsResponse || []);
        setCategories(categoriesResponse || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.includes(customerSearch)
  );

  const filteredMenuItems = menuItems.filter(item => {
    if (selectedCategory === "all") return item.isAvailable;
    return item.categoryId === selectedCategory && item.isAvailable;
  });

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setOrderItems(prev => prev.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
    } else {
      setOrderItems(prev => prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.menuItem.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerId: selectedCustomer.id,
        notes: notes.trim() || undefined,
        items: orderItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      };

      await apiClient.createOrder(orderData);
      
      toast.success("Order created successfully!");
      router.push("/dashboard/reception/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["RECEPTION"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/reception/orders">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
            <p className="text-muted-foreground">
              Select a customer and add items to create a new order
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Select Customer
                </CardTitle>
                <CardDescription>
                  Choose the customer for this order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {selectedCustomer ? (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone && `${selectedCustomer.phone} • `}
                          {selectedCustomer.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone && `${customer.phone} • `}
                          {customer.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coffee className="mr-2 h-5 w-5" />
                  Menu Items
                </CardTitle>
                <CardDescription>
                  Add items to the order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToOrder(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  Review and submit the order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.length > 0 ? (
                  <>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {orderItems.map((item) => (
                        <div key={item.menuItemId} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{item.menuItem.name}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromOrder(item.menuItemId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-medium">
                              ${(item.menuItem.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Input
                        id="notes"
                        placeholder="Special instructions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !selectedCustomer}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Order
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">No items added</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add items from the menu to create an order.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}