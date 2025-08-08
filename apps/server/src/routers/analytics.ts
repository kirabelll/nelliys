import { Router } from "express";
import prisma from "../../prisma";
import {
  requireAuth,
  requireSuperAdmin,
  requireReception,
  requireAnyRole,
  requireChef,
} from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// GET /api/analytics/reception-overview - Get reception dashboard stats
router.get(
  "/reception-overview",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalCustomers,
        totalOrders,
        todayOrders,
        pendingOrders,
        ordersByStatus,
      ] = await Promise.all([
        prisma.customer.count(),
        prisma.order.count(),
        prisma.order.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.order.count({
          where: {
            status: "PENDING",
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
      ]);

      res.json({
        totalCustomers,
        totalOrders,
        todayOrders,
        pendingOrders,
        ordersByStatus: (
          ordersByStatus as Array<{
            status: string;
            _count: { status: number };
          }>
        ).map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      });
    } catch (error) {
      console.error("Error fetching reception analytics:", error);
      res.status(500).json({ error: "Failed to fetch reception analytics" });
    }
  }
);

// GET /api/analytics/chef-overview - Get chef dashboard stats
router.get(
  "/chef-overview",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        newOrders,
        preparingOrders,
        readyOrders,
        completedTodayOrders,
        totalKitchenOrders,
        ordersByStatus,
      ] = await Promise.all([
        prisma.order.count({
          where: {
            status: "PAID",
          },
        }),
        prisma.order.count({
          where: {
            status: "PREPARING",
          },
        }),
        prisma.order.count({
          where: {
            status: "READY",
          },
        }),
        prisma.order.count({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.order.count({
          where: {
            status: {
              in: ["PAID", "PREPARING", "READY"],
            },
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
      ]);

      res.json({
        newOrders,
        preparingOrders,
        readyOrders,
        completedTodayOrders,
        totalKitchenOrders,
        ordersByStatus: (
          ordersByStatus as Array<{
            status: string;
            _count: { status: number };
          }>
        ).map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
      });
    } catch (error) {
      console.error("Error fetching chef analytics:", error);
      res.status(500).json({ error: "Failed to fetch chef analytics" });
    }
  }
);

// GET /api/analytics/overview - Get dashboard overview stats
router.get(
  "/overview",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [
        totalUsers,
        totalCustomers,
        totalMenuItems,
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        usersByRole,
        ordersByStatus,
        recentOrders,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.customer.count(),
        prisma.menuItem.count(),
        prisma.order.count(),
        prisma.payment.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amount: true },
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          _sum: { amount: true },
        }),
        prisma.user.groupBy({
          by: ["role"],
          _count: { role: true },
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            payment: true,
          },
        }),
      ]);

      // Debug logging
      console.log("Analytics Debug:", {
        totalRevenue: totalRevenue._sum.amount,
        todayRevenue: todayRevenue._sum.amount,
        totalOrders,
        todayOrders,
      });

      res.json({
        overview: {
          totalUsers,
          totalCustomers,
          totalMenuItems,
          totalOrders,
          totalRevenue: totalRevenue._sum.amount || 0,
          todayOrders,
          todayRevenue: todayRevenue._sum.amount || 0,
        },
        usersByRole: (
          usersByRole as Array<{ role: string; _count: { role: number } }>
        ).map((item) => ({
          role: item.role,
          count: item._count.role,
        })),
        ordersByStatus: (
          ordersByStatus as Array<{
            status: string;
            _count: { status: number };
          }>
        ).map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  }
);

// GET /api/analytics/revenue - Get revenue analytics
router.get(
  "/revenue",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period = "7d" } = req.query;

      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case "24h":
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      const revenueData = await prisma.payment.findMany({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          order: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by date
      const dailyRevenue = revenueData.reduce((acc: any, payment) => {
        const date = payment.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orders: 0 };
        }
        acc[date].revenue += Number(payment.amount);
        acc[date].orders += 1;
        return acc;
      }, {});

      // Fill in missing dates with zero values for better chart visualization
      const chartData = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        chartData.push({
          date: dateStr,
          revenue: dailyRevenue[dateStr]?.revenue || 0,
          orders: dailyRevenue[dateStr]?.orders || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const totalRevenue = revenueData.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const totalOrders = revenueData.length;

      res.json({
        chartData,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ error: "Failed to fetch revenue analytics" });
    }
  }
);

// GET /api/analytics/menu-performance - Get menu item performance
router.get(
  "/menu-performance",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const menuPerformance = await prisma.orderItem.groupBy({
        by: ["menuItemId"],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        _count: {
          id: true,
        },
      });

      const menuItemsData = await Promise.all(
        (
          menuPerformance as Array<{
            menuItemId: string;
            _sum: { quantity: number | null; totalPrice: any };
            _count: { id: number };
          }>
        ).map(async (item) => {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId },
            include: { category: true },
          });

          return {
            id: item.menuItemId,
            name: menuItem?.name || "Unknown Item",
            category: menuItem?.category?.name || "Unknown Category",
            totalQuantity: item._sum.quantity || 0,
            totalRevenue: Number(item._sum.totalPrice) || 0,
            orderCount: item._count.id,
          };
        })
      );

      // Sort by total revenue
      menuItemsData.sort((a, b) => b.totalRevenue - a.totalRevenue);

      res.json({
        topItems: menuItemsData.slice(0, 10),
        categoryPerformance: menuItemsData.reduce((acc: any, item) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              category: item.category,
              totalRevenue: 0,
              totalQuantity: 0,
              itemCount: 0,
            };
          }
          acc[item.category].totalRevenue += item.totalRevenue;
          acc[item.category].totalQuantity += item.totalQuantity;
          acc[item.category].itemCount += 1;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("Error fetching menu performance:", error);
      res.status(500).json({ error: "Failed to fetch menu performance" });
    }
  }
);

// GET /api/analytics/customer-insights - Get customer analytics
router.get(
  "/customer-insights",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [customerOrderCounts, newCustomersThisMonth, customerRetention] =
        await Promise.all([
          prisma.customer.findMany({
            include: {
              _count: {
                select: { orders: true },
              },
              orders: {
                include: {
                  payment: true,
                },
              },
            },
          }),
          prisma.customer.count({
            where: {
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          }),
          prisma.customer.count({
            where: {
              orders: {
                some: {
                  createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          }),
        ]);

      const customerSegments = {
        new: customerOrderCounts.filter((c) => c._count.orders === 1).length,
        returning: customerOrderCounts.filter(
          (c) => c._count.orders > 1 && c._count.orders <= 5
        ).length,
        loyal: customerOrderCounts.filter((c) => c._count.orders > 5).length,
      };

      const topCustomers = customerOrderCounts
        .map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          orderCount: customer._count.orders,
          totalSpent: customer.orders.reduce(
            (sum, order) =>
              sum +
              (order.payment?.status === "COMPLETED"
                ? Number(order.payment.amount)
                : 0),
            0
          ),
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      res.json({
        customerSegments,
        newCustomersThisMonth,
        customerRetention,
        topCustomers,
        totalCustomers: customerOrderCounts.length,
      });
    } catch (error) {
      console.error("Error fetching customer insights:", error);
      res.status(500).json({ error: "Failed to fetch customer insights" });
    }
  }
);

export default router;
