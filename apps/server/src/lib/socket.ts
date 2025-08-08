import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifySimpleJWT } from "./jwt-utils";

export interface SocketUser {
  id: string;
  name: string;
  email: string;
  role: string;
}



let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3001",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token using our simple JWT utility
      const decoded = verifySimpleJWT(token);
      if (!decoded) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket & { user?: SocketUser }) => {
    console.log(`User connected: ${socket.user?.name} (${socket.user?.role})`);

    // Join role-based rooms
    if (socket.user?.role) {
      socket.join(socket.user.role.toLowerCase());
      socket.join("all-users");
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user?.name}`);
    });

    // Handle order status updates
    socket.on("order-status-update", (data: any) => {
      // Broadcast to all users
      io.to("all-users").emit("order-updated", data);
    });

    // Handle new order creation
    socket.on("order-created", (data: any) => {
      // Notify reception and cashier
      io.to("reception").emit("new-order", data);
      io.to("cashier").emit("new-order", data);
    });

    // Handle menu updates
    socket.on("menu-updated", (data: any) => {
      // Notify all users about menu changes
      io.to("all-users").emit("menu-changed", data);
    });

    // Handle customer updates
    socket.on("customer-updated", (data: any) => {
      // Notify reception users
      io.to("reception").emit("customer-changed", data);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

// Event emitters for different actions
export const emitOrderUpdate = (order: any) => {
  if (io) {
    io.to("all-users").emit("order-updated", order);
  }
};

export const emitNewOrder = (order: any) => {
  if (io) {
    io.to("reception").emit("new-order", order);
    io.to("cashier").emit("new-order", order);
    io.to("chef").emit("new-order", order);
  }
};

export const emitMenuUpdate = (menuItem: any) => {
  if (io) {
    io.to("all-users").emit("menu-changed", menuItem);
  }
};

export const emitCustomerUpdate = (customer: any) => {
  if (io) {
    io.to("reception").emit("customer-changed", customer);
  }
};