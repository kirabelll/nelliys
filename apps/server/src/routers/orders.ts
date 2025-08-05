import { Router } from "express";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma";
import {
  requireAuth,
  requireReception,
  requireCashier,
  requireChef,
  requireAnyRole,
} from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import {
  generateOrderNumber,
  calculateOrderTotal,
  isValidOrderStatusTransition,
} from "../lib/utils";
import { emitNewOrder, emitOrderUpdate } from "../lib/socket";

const router: Router = Router();

// Validation schemas
const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "Menu item is required"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one item is required"),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PAID",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ]),
});

// GET /api/orders - List orders (filtered by role)
router.get(
  "/",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { status, page = "1", limit = "10" } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const userRole = req.user?.role;

      let where: any = {};

      // Filter orders based on user role
      if (userRole === "RECEPTION") {
        // Reception can see all orders
      } else if (userRole === "CASHIER") {
        // Cashier sees pending and confirmed orders
        where.status = { in: ["PENDING", "CONFIRMED", "PAID"] };
      } else if (userRole === "CHEF") {
        // Chef sees paid, preparing, and ready orders
        where.status = { in: ["PAID", "PREPARING", "READY"] };
      }

      if (status) {
        where.status = status as string;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: userRole === "RECEPTION" ? "asc" : "desc" },
          include: {
            customer: true,
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            processedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            preparedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            orderItems: {
              include: {
                menuItem: {
                  include: { category: true },
                },
              },
            },
            payment: true,
          },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        orders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);

// POST /api/orders - Create new order (Reception only)
router.post(
  "/",
  requireAuth,
  requireReception,
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createOrderSchema.parse(req.body);

      // Verify customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return res.status(400).json({ error: "Customer not found" });
      }

      // Verify all menu items exist and calculate total
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: validatedData.items.map((item) => item.menuItemId) },
          isAvailable: true,
        },
      });

      if (menuItems.length !== validatedData.items.length) {
        return res
          .status(400)
          .json({ error: "Some menu items are not available" });
      }

      // Calculate order total
      const orderItems = validatedData.items.map((item) => {
        const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)!;
        const unitPrice = menuItem.price;
        const totalPrice = new Decimal(item.quantity).mul(unitPrice);

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      const totalAmount = calculateOrderTotal(orderItems);

      // Create order with items
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: validatedData.customerId,
          createdById: req.user!.id,
          notes: validatedData.notes,
          totalAmount,
          orderItems: {
            create: orderItems.map((item) => ({
              id: `orderitem_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
        },
      });

      // Emit real-time event for new order
      emitNewOrder(order);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  }
);

// GET /api/orders/:id - Get order by ID
router.get(
  "/:id",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          processedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          preparedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
          payment: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }
);

// PUT /api/orders/:id/status - Update order status
router.put(
  "/:id/status",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = updateOrderStatusSchema.parse(req.body);
      const userRole = req.user!.role;

      // Get current order
      const currentOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!currentOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Validate status transition
      if (
        !isValidOrderStatusTransition(currentOrder.status, status, userRole)
      ) {
        return res.status(400).json({
          error: `Cannot change order from ${currentOrder.status} to ${status} as ${userRole}`,
        });
      }

      // Update order with appropriate user tracking
      const updateData: any = { status };

      if (status === "CONFIRMED" && userRole === "CASHIER") {
        updateData.processedById = req.user!.id;
      } else if (status === "PREPARING" && userRole === "CHEF") {
        updateData.preparedById = req.user!.id;
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          processedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          preparedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
          payment: true,
        },
      });

      // Emit real-time event for order status update
      emitOrderUpdate(updatedOrder);

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

// PUT /api/orders/:id/accept - Accept order (Cashier only)
router.put(
  "/:id/accept",
  requireAuth,
  requireCashier,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "PENDING") {
        return res.status(400).json({ error: "Order is not pending" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          processedById: req.user!.id,
        },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          processedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
        },
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ error: "Failed to accept order" });
    }
  }
);

// PUT /api/orders/:id/ready - Mark order as ready (Chef only)
router.put(
  "/:id/ready",
  requireAuth,
  requireChef,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "PREPARING") {
        return res.status(400).json({ error: "Order is not being prepared" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: "READY",
          preparedById: req.user!.id,
        },
        include: {
          customer: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          processedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          preparedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
        },
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error marking order as ready:", error);
      res.status(500).json({ error: "Failed to mark order as ready" });
    }
  }
);

// GET /api/orders/kitchen - Get orders for kitchen (Chef only)
router.get(
  "/kitchen",
  requireAuth,
  requireChef,
  async (req: AuthenticatedRequest, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          status: { in: ["PAID", "PREPARING", "READY"] },
        },
        orderBy: { createdAt: "asc" },
        include: {
          customer: true,
          orderItems: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
        },
      });

      res.json(orders);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
      res.status(500).json({ error: "Failed to fetch kitchen orders" });
    }
  }
);

export default router;
