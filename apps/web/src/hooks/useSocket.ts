"use client";

import { useEffect, useRef, useState } from "react";

// Conditional import for Socket.IO - fallback if not installed
let io: any = null;
let Socket: any = null;

try {
  const socketIO = require("socket.io-client");
  io = socketIO.io;
  Socket = socketIO.Socket;
} catch (error) {
  console.warn("Socket.IO client not installed, using fallback mode");
}

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true } = options;
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Check if Socket.IO is available
    if (!io) {
      setError("Socket.IO not installed - using polling mode");
      return;
    }

    const initializeSocket = async () => {
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) {
        setError("No authentication token found");
        return;
      }

      try {
        // Get JWT token for Socket.IO
        const serverUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        const response = await fetch(`${serverUrl}/api/socket-token`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to get socket token");
        }

        const { token } = await response.json();

        socketRef.current = io(serverUrl, {
          auth: {
            token,
          },
          transports: ["websocket", "polling"],
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
          console.log("Connected to server");
          setIsConnected(true);
          setError(null);
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from server");
          setIsConnected(false);
        });

        socket.on("connect_error", (err: any) => {
          console.error("Connection error:", err.message);
          setError(err.message);
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        setError("Failed to initialize socket connection");
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    // Return empty function if socket not available
    return () => {};
  };

  const off = (event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};
