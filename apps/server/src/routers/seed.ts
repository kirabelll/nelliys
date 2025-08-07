import { Router } from "express";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// POST /api/seed/sample-data - Create sample data for testing
router.post(
  "/sample-data",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Create sample customers
      const customers = await Promise.all([
        prisma.customer.upsert({
          where: { id: "customer_1" },
          update: {},
          create: {
            id: "customer_1",
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
          },
        }),
        prisma.customer.upsert({
          where: { id: "customer_2" },
          update: {},
          create: {
            id: "customer_2",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "+1234567891",
          },
        }),
        prisma.customer.upsert({
          where: { id: "customer_3" },
          update: {},
          create: {
            id: "customer_3",
            name: "Bob Johnson",
            email: "bob@example.com",
            phone: "+1234567892",
          },
        }),
      ]);

      // Create sample categories
      const categories = await Promise.all([
        prisma.category.upsert({
          where: { id: "cat_1" },
          update: {},
          create: {
            id: "cat_1",
            name: "Coffee",
            description: "Hot and cold coffee drinks",
            isActive: true,
          },
        }),
        prisma.category.upsert({
          where: { id: "cat_2" },
          update: {},
          create: {
            id: "cat_2",
            name: "Pastries",
            description: "Fresh baked goods",
            isActive: true,
          },
        }),
        prisma.category.upsert({
          where: { id: "cat_3" },
          update: {},
          create: {
            id: "cat_3",
            name: "Sandwiches",
            description: "Fresh sandwiches and wraps",
            isActive: true,
          },
        }),
      ]);

      // Create sample menu items
      const menuItems = await Promise.all([
        prisma.menuItem.upsert({
          where: { id: "item_1" },
          update: {},
          create: {
            id: "item_1",
            name: "Espresso",
            description: "Strong Italian coffee",
            price: new Decimal(3.50),
            isAvailable: true,
            categoryId: "cat_1",
          },
        }),
        prisma.menuItem.upsert({
          where: { id: "item_2" },
          update: {},
          create: {
            id: "item_2",
            name: "Cappuccino",
            description: "Espresso with steamed milk",
            price: new Decimal(4.50),
            isAvailable: true,
            categoryId: "cat_1",
          },
        }),
        prisma.menuItem.upsert({
          where: { id: "item_3" },
          update: {},
          create: {
            id: "item_3",
            name: "Croissant",
            description: "Buttery French pastry",
            price: new Decimal(2.50),
            isAvailable: true,
            categoryId: "cat_2",
          },
        }),
        prisma.menuItem.upsert({
          where: { id: "item_4" },
          update: {},
          create: {
            id: "item_4",
            name: "Club Sandwich",
            description: "Triple-decker sandwich",
            price: new Decimal(8.50),
            isAvailable: true,
            categoryId: "cat_3",
          },
        }),
      ]);

      // Create sample orders
      const orders = [];
      for (let i = 1; i <= 10; i++) {
        const customerId = customers[i % 3].id;
        const orderDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        
        const order = await prisma.order.upsert({
          where: { id: `order_${i}` },
          update: {},
          create: {
            id: `order_${i}`,
            orderNumber: `ORD-${String(i).padStart(4, '0')}`,
            customerId,
            createdById: req.user!.id,
            status: i <= 6 ? "COMPLETED" : i % 3 === 0 ? "PREPARING" : "CONFIRMED",
            totalAmount: new Decimal((Math.random() * 50 + 10).toFixed(2)),
            createdAt: orderDate,
            updatedAt: orderDate,
          },
        });

        // Create order items
        const numItems = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numItems; j++) {
          const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const totalPrice = new Decimal(quantity).mul(menuItem.price);

          await prisma.orderItem.upsert({
            where: { id: `orderitem_${i}_${j}` },
            update: {},
            create: {
              id: `orderitem_${i}_${j}`,
              orderId: order.id,
              menuItemId: menuItem.id,
              quantity,
              unitPrice: menuItem.price,
              totalPrice,
            },
          });
        }

        // Create payment for completed orders
        if (order.status === "COMPLETED") {
          const payment = await prisma.payment.upsert({
            where: { id: `payment_${i}` },
            update: {},
            create: {
              id: `payment_${i}`,
              orderId: order.id,
              amount: order.totalAmount,
              status: "COMPLETED",
              paymentMethod: "CASH",
              createdAt: orderDate,
              updatedAt: orderDate,
            },
          });
          console.log(`Created payment for order ${i}:`, payment.amount);
        }

        orders.push(order);
      }

      res.json({
        message: "Sample data created successfully",
        data: {
          customers: customers.length,
          categories: categories.length,
          menuItems: menuItems.length,
          orders: orders.length,
        },
      });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ error: "Failed to create sample data" });
    }
  }
);

// GET /api/seed/check-data - Check current data in database
router.get(
  "/check-data",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [orders, payments, customers, menuItems] = await Promise.all([
        prisma.order.findMany({
          include: { payment: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.payment.findMany({
          where: { status: "COMPLETED" },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        prisma.customer.count(),
        prisma.menuItem.count(),
      ]);

      const totalRevenue = await prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      });

      res.json({
        summary: {
          totalOrders: orders.length,
          completedPayments: payments.length,
          totalRevenue: totalRevenue._sum.amount || 0,
          customers: customers,
          menuItems: menuItems,
        },
        recentOrders: orders,
        recentPayments: payments,
      });
    } catch (error) {
      console.error("Error checking data:", error);
      res.status(500).json({ error: "Failed to check data" });
    }
  }
);

// DELETE /api/seed/clear-data - Clear all sample data
router.delete(
  "/clear-data",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Delete in correct order due to foreign key constraints
      await prisma.payment.deleteMany({});
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.menuItem.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.customer.deleteMany({});

      res.json({ message: "All sample data cleared successfully" });
    } catch (error) {
      console.error("Error clearing sample data:", error);
      res.status(500).json({ error: "Failed to clear sample data" });
    }
  }
);

export default router;