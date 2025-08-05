import { Router } from "express";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma";
import { requireAuth, requireCashier, requireAnyRole } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// Validation schemas
const processPaymentSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "digital"], {
    errorMap: () => ({ message: "Payment method must be cash, card, or digital" })
  }),
  transactionId: z.string().optional(),
});

// POST /api/payments/:orderId - Process payment for order (Cashier only)
router.post("/:orderId", requireAuth, requireCashier, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, transactionId } = processPaymentSchema.parse(req.body);

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "CONFIRMED") {
      return res.status(400).json({ error: "Order must be confirmed before payment" });
    }

    if (order.payment) {
      return res.status(400).json({ error: "Payment already exists for this order" });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        amount: order.totalAmount,
        paymentMethod,
        transactionId,
        status: "COMPLETED",
      },
    });

    // Update order status to PAID
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        processedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        orderItems: {
          include: {
            menuItem: {
              include: { category: true }
            }
          }
        },
        payment: true,
      },
    });

    res.status(201).json({
      payment,
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

// GET /api/payments - List all payments (any authenticated user)
router.get("/", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = "1", limit = "10", status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) {
      where.status = status as string;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              customer: true,
              orderItems: {
                include: {
                  menuItem: true,
                }
              }
            }
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// GET /api/payments/:id - Get payment by ID
router.get("/:id", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            orderItems: {
              include: {
                menuItem: {
                  include: { category: true }
                }
              }
            }
          }
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// PUT /api/payments/:id/refund - Refund payment (Cashier only)
router.put("/:id/refund", requireAuth, requireCashier, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status !== "COMPLETED") {
      return res.status(400).json({ error: "Can only refund completed payments" });
    }

    // Update payment status to refunded
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status: "REFUNDED" },
    });

    // Update order status to cancelled
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELLED" },
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ error: "Failed to refund payment" });
  }
});

export default router;