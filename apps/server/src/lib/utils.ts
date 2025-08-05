import { Decimal } from "@prisma/client/runtime/library";

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

export const calculateOrderTotal = (items: Array<{ quantity: number; unitPrice: Decimal }>): Decimal => {
  return items.reduce((total, item) => {
    return total.add(new Decimal(item.quantity).mul(item.unitPrice));
  }, new Decimal(0));
};

export const formatCurrency = (amount: Decimal): string => {
  return `$${amount.toFixed(2)}`;
};

export const isValidOrderStatusTransition = (
  currentStatus: string,
  newStatus: string,
  userRole: string
): boolean => {
  const transitions: Record<string, Record<string, string[]>> = {
    PENDING: {
      RECEPTION: ["CANCELLED"],
      CASHIER: ["CONFIRMED", "CANCELLED"],
      CHEF: []
    },
    CONFIRMED: {
      RECEPTION: [],
      CASHIER: ["PAID", "CANCELLED"],
      CHEF: []
    },
    PAID: {
      RECEPTION: [],
      CASHIER: ["CANCELLED"],
      CHEF: ["PREPARING"]
    },
    PREPARING: {
      RECEPTION: [],
      CASHIER: [],
      CHEF: ["READY", "CANCELLED"]
    },
    READY: {
      RECEPTION: ["COMPLETED"],
      CASHIER: ["COMPLETED"],
      CHEF: ["COMPLETED"]
    },
    COMPLETED: {
      RECEPTION: [],
      CASHIER: [],
      CHEF: []
    },
    CANCELLED: {
      RECEPTION: [],
      CASHIER: [],
      CHEF: []
    }
  };

  return transitions[currentStatus]?.[userRole]?.includes(newStatus) || false;
};