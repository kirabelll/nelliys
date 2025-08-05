"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import type { Order, Customer, MenuItem } from "@/types";

interface RealTimeDataState {
  orders: Order[];
  customers: Customer[];
  menuItems: MenuItem[];
  stats: {
    totalCustomers: number;
    totalMenuItems: number;
    todaysOrders: number;
  };
}

export const useRealTimeData = () => {
  const { on, off, isConnected } = useSocket();
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<RealTimeDataState>({
    orders: [],
    customers: [],
    menuItems: [],
    stats: {
      totalCustomers: 0,
      totalMenuItems: 0,
      todaysOrders: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      
      const [ordersResponse, customersResponse, menuResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/menu/items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [ordersData, customersData, menuData] = await Promise.all([
        ordersResponse.ok ? ordersResponse.json() : { orders: [] },
        customersResponse.ok ? customersResponse.json() : { customers: [] },
        menuResponse.ok ? menuResponse.json() : [],
      ]);

      const today = new Date().toDateString();
      const todaysOrders = ordersData.orders?.filter((order: Order) => 
        new Date(order.createdAt).toDateString() === today
      ).length || 0;

      setData({
        orders: ordersData.orders || [],
        customers: customersData.customers || [],
        menuItems: Array.isArray(menuData) ? menuData : [],
        stats: {
          totalCustomers: customersData.pagination?.total || 0,
          totalMenuItems: Array.isArray(menuData) ? menuData.length : 0,
          todaysOrders,
        },
      });
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    // If Socket.IO is not connected, use polling as fallback
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchInitialData();
      }, 30000); // Poll every 30 seconds
      
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [fetchInitialData, isConnected]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Order events
    const handleNewOrder = (order: Order) => {
      setData(prev => ({
        ...prev,
        orders: [order, ...prev.orders],
        stats: {
          ...prev.stats,
          todaysOrders: prev.stats.todaysOrders + 1,
        },
      }));
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ),
      }));
    };

    // Customer events
    const handleCustomerChange = (customer: Customer) => {
      setData(prev => {
        const existingIndex = prev.customers.findIndex(c => c.id === customer.id);
        let newCustomers;
        let newStats = prev.stats;

        if (existingIndex >= 0) {
          // Update existing customer
          newCustomers = prev.customers.map(c => 
            c.id === customer.id ? customer : c
          );
        } else {
          // Add new customer
          newCustomers = [customer, ...prev.customers];
          newStats = {
            ...prev.stats,
            totalCustomers: prev.stats.totalCustomers + 1,
          };
        }

        return {
          ...prev,
          customers: newCustomers,
          stats: newStats,
        };
      });
    };

    // Menu events
    const handleMenuChange = (menuItem: MenuItem) => {
      setData(prev => {
        const existingIndex = prev.menuItems.findIndex(item => item.id === menuItem.id);
        let newMenuItems;
        let newStats = prev.stats;

        if (existingIndex >= 0) {
          // Update existing menu item
          newMenuItems = prev.menuItems.map(item => 
            item.id === menuItem.id ? menuItem : item
          );
        } else {
          // Add new menu item
          newMenuItems = [menuItem, ...prev.menuItems];
          newStats = {
            ...prev.stats,
            totalMenuItems: prev.stats.totalMenuItems + 1,
          };
        }

        return {
          ...prev,
          menuItems: newMenuItems,
          stats: newStats,
        };
      });
    };

    // Register event listeners
    const unsubscribeNewOrder = on?.("new-order", handleNewOrder);
    const unsubscribeOrderUpdate = on?.("order-updated", handleOrderUpdate);
    const unsubscribeCustomerChange = on?.("customer-changed", handleCustomerChange);
    const unsubscribeMenuChange = on?.("menu-changed", handleMenuChange);

    // Cleanup function
    return () => {
      unsubscribeNewOrder?.();
      unsubscribeOrderUpdate?.();
      unsubscribeCustomerChange?.();
      unsubscribeMenuChange?.();
    };
  }, [isConnected, on]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    ...data,
    loading,
    isConnected,
    refreshData,
  };
};