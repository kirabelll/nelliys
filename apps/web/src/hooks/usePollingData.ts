"use client";

import { useEffect, useState, useCallback } from "react";
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

export const usePollingData = () => {
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchInitialData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    ...data,
    loading,
    isConnected: false, // Always false for polling mode
    refreshData,
    lastUpdate,
  };
};