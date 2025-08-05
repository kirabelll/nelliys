"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  User,
  DollarSign,
} from "lucide-react";
import type { Customer, MenuItem, Category } from "@/types";
import { CustomerList } from "@/components/customers/customer-list";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const [step, setStep] = useState<"customer" | "items" | "review">("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchMenuData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/menu/items?available=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/menu/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (itemsResponse.ok && categoriesResponse.ok) {
        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();
        setMenuItems(itemsData);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching menu data:", error);
    }
  };

  useEffect(() => {
    if (open && step === "items") {
      fetchMenuData();
    }
  }, [open, step]);

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep("items");
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(
      (item) => item.menuItem.id === menuItem.id
    );
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(
        orderItems.filter((item) => item.menuItem.id !== menuItemId)
      );
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.menuItem.id === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + Number(item.menuItem.price) * item.quantity,
      0
    );
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          notes: notes.trim() || undefined,
          items: orderItems.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        onOrderCreated();
        resetDialog();
      }
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("customer");
    setSelectedCustomer(null);
    setOrderItems([]);
    setNotes("");
    setSearchQuery("");
    setSelectedCategory("");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetDialog();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            {step === "customer" && "Select a customer for this order"}
            {step === "items" && "Add items to the order"}
            {step === "review" && "Review and confirm the order"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Customer Selection */}
        {step === "customer" && (
          <div className="space-y-4">
            <CustomerList
              onSelectCustomer={handleCustomerSelected}
              selectable={true}
            />
          </div>
        )}

        {/* Step 2: Menu Items Selection */}
        {step === "items" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{selectedCustomer?.name}</span>
              </div>
              <Button variant="outline" onClick={() => setStep("customer")}>
                Change Customer
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="font-medium">Menu Items</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {item.category?.name}
                            </Badge>
                            <span className="font-medium">
                              ${Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => addToOrder(item)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">
                  Order Items ({orderItems.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {orderItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    orderItems.map((item) => (
                      <Card key={item.menuItem.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {item.menuItem.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              ${Number(item.menuItem.price).toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItem.id,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(
                                  item.menuItem.id,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>

                {orderItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-medium">
                      <span>Total:</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions or notes..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "items" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={loading || orderItems.length === 0}
              >
                {loading
                  ? "Creating..."
                  : `Create Order ($${calculateTotal().toFixed(2)})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
