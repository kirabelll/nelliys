"use client";

import { useState, useEffect } from "react";
import { usePollingData as useRealTimeData } from "@/hooks/usePollingData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  User,
  Calendar,
  ShoppingCart
} from "lucide-react";
import type { Customer } from "@/types";
import { CustomerDialog } from "./customer-dialog";

interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
  selectable?: boolean;
}

export function CustomerList({ onSelectCustomer, selectable = false }: CustomerListProps) {
  const { customers: allCustomers, loading } = useRealTimeData();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter customers based on search query
  const customers = allCustomers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  const handleCustomerSaved = () => {
    setShowDialog(false);
    setSelectedCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDialog(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    if (selectable && onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading customers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-4">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No customers match your search." : "Get started by adding your first customer."}
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card 
              key={customer.id} 
              className={`transition-colors ${selectable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
              onClick={() => handleSelectCustomer(customer)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {customer._count && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {customer._count.orders} orders
                      </Badge>
                    )}
                    {!selectable && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Customer since {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CustomerDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        customer={selectedCustomer}
        onSaved={handleCustomerSaved}
      />
    </div>
  );
}