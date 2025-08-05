import type { Order } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL;

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Customer endpoints
  async getCustomers(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/customers${query ? `?${query}` : ""}`);
  }

  async createCustomer(data: { name: string; phone?: string; email?: string }) {
    return this.request("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(
    id: string,
    data: { name?: string; phone?: string; email?: string }
  ) {
    return this.request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async searchCustomers(query: string) {
    return this.request(`/customers/search?q=${encodeURIComponent(query)}`);
  }

  // Menu endpoints
  async getCategories() {
    return this.request("/menu/categories");
  }

  async createCategory(data: { name: string; description?: string }) {
    return this.request("/menu/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMenuItems(params?: { categoryId?: string; available?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.available !== undefined)
      searchParams.set("available", params.available.toString());

    const query = searchParams.toString();
    return this.request(`/menu/items${query ? `?${query}` : ""}`);
  }

  async createMenuItem(data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
  }) {
    return this.request("/menu/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMenuItem(id: string) {
    return this.request(`/menu/items/${id}`);
  }

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      isAvailable?: boolean;
    }
  ) {
    return this.request(`/menu/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // User management endpoints
  async getUsers() {
    return this.request("/users");
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: "RECEPTION" | "CHEF" | "CASHIER";
  }) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(id: string, role: "RECEPTION" | "CHEF" | "CASHIER") {
    return this.request(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async getCurrentUser() {
    return this.request("/users/me");
  }

  // Order endpoints
  async getOrders(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return this.request(`/orders${query ? `?${query}` : ""}`);
  }

  async createOrder(data: {
    customerId: string;
    notes?: string;
    items: Array<{ menuItemId: string; quantity: number }>;
  }) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async acceptOrder(id: string) {
    return this.request(`/orders/${id}/accept`, {
      method: "PUT",
    });
  }

  async markOrderReady(id: string) {
    return this.request(`/orders/${id}/ready`, {
      method: "PUT",
    });
  }

  async getKitchenOrders() {
    return this.request("/orders/kitchen");
  }

  // Payment endpoints
  async processPayment(
    orderId: string,
    data: {
      paymentMethod: "cash" | "card" | "digital";
      transactionId?: string;
    }
  ) {
    return this.request(`/payments/${orderId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return this.request(`/payments${query ? `?${query}` : ""}`);
  }

  async getPayment(id: string) {
    return this.request(`/payments/${id}`);
  }

  async refundPayment(id: string) {
    return this.request(`/payments/${id}/refund`, {
      method: "PUT",
    });
  }
}

export const apiClient = new ApiClient();
