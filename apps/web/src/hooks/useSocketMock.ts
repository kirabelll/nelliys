"use client";

import { useState } from "react";

// Mock implementation for Socket.IO when packages aren't installed
export const useSocket = () => {
  const [isConnected] = useState(false);
  const [error] = useState<string | null>("Socket.IO not installed - using polling mode");

  const emit = (event: string, data?: any) => {
    console.log("Mock emit:", event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    console.log("Mock on:", event);
    return () => console.log("Mock off:", event);
  };

  const off = (event: string, callback?: (data: any) => void) => {
    console.log("Mock off:", event);
  };

  return {
    socket: null,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};