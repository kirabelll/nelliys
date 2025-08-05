"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  DollarSign, 
  Clock,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800", 
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800"
};

export function OrderDetailsDialog({ open, onOpenChange, order }: OrderDetailsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order #{order.orderNumber}
            <Badge className={statusColors[order.status]}>
              {order.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{order.customer?.name}</span>
              </div>
              {order.customer?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer.phone}</span>
                </div>
              )}
              {order.customer?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.orderItems?.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.menuItem?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.menuItem?.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {item.menuItem?.category?.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ${Number(item.unitPrice).toFixed(2)} × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${Number(item.totalPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {index < (order.orderItems?.length || 0) - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between text-lg font-medium">
                <span>Total Amount:</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Order Created</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {order.createdBy?.name}
                  </p>
                </div>
              </div>

              {order.processedBy && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Order Processed</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Processed by {order.processedBy.name}
                    </p>
                  </div>
                </div>
              )}

              {order.preparedBy && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Order Prepared</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Prepared by {order.preparedBy.name}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Payment Status:</span>
                  <Badge variant={order.payment.status === "COMPLETED" ? "default" : "secondary"}>
                    {order.payment.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Method:</span>
                  <span>{order.payment.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount:</span>
                  <span>${Number(order.payment.amount).toFixed(2)}</span>
                </div>
                {order.payment.transactionId && (
                  <div className="flex items-center justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-sm">{order.payment.transactionId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}