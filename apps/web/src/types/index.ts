export type UserRole = "RECEPTION" | "CHEF" | "CASHIER";

export type OrderStatus = 
  | "PENDING" 
  | "CONFIRMED" 
  | "PAID" 
  | "PREPARING" 
  | "READY" 
  | "COMPLETED" 
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  _count?: {
    orders: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  menuItems?: MenuItem[];
  _count?: {
    menuItems: number;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  orderItems?: OrderItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  customer?: Customer;
  createdById: string;
  createdBy?: User;
  processedById?: string;
  processedBy?: User;
  preparedById?: string;
  preparedBy?: User;
  orderItems?: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderId: string;
  order?: Order;
  menuItemId: string;
  menuItem?: MenuItem;
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  order?: Order;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}