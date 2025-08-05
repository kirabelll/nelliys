import { Router } from "express";
import { z } from "zod";
import prisma from "../../prisma";
import { requireAuth, requireReception, requireReceptionOrCashier } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { emitCustomerUpdate } from "../lib/socket";

const router: Router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// GET /api/customers - List all customers (Reception only)
router.get(
  "/",
  requireAuth,
  requireReception,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { search, page = "1", limit = "10" } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where = search
        ? {
            OR: [
              {
                name: {
                  contains: search as string,
                  mode: "insensitive" as const,
                },
              },
              { phone: { contains: search as string } },
              {
                email: {
                  contains: search as string,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { orders: true },
            },
          },
        }),
        prisma.customer.count({ where }),
      ]);

      res.json({
        customers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  }
);

// POST /api/customers - Create new customer (Reception or Cashier)
router.post(
  "/",
  requireAuth,
  requireReceptionOrCashier,
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createCustomerSchema.parse(req.body);

      // Check for existing customer with same phone or email
      if (validatedData.phone || validatedData.email) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            OR: [
              validatedData.phone ? { phone: validatedData.phone } : {},
              validatedData.email ? { email: validatedData.email } : {},
            ].filter((condition) => Object.keys(condition).length > 0),
          },
        });

        if (existingCustomer) {
          return res.status(400).json({
            error: "Customer with this phone or email already exists",
          });
        }
      }

      const customer = await prisma.customer.create({
        data: validatedData,
      });

      // Emit real-time event for new customer
      emitCustomerUpdate(customer);
      
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  }
);

// GET /api/customers/:id - Get customer by ID (Reception only)
router.get(
  "/:id",
  requireAuth,
  requireReception,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              orderItems: {
                include: {
                  menuItem: true,
                },
              },
              payment: true,
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  }
);

// PUT /api/customers/:id - Update customer (Reception only)
router.put(
  "/:id",
  requireAuth,
  requireReception,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateCustomerSchema.parse(req.body);

      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!existingCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Check for conflicts with other customers
      if (validatedData.phone || validatedData.email) {
        const conflictingCustomer = await prisma.customer.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  validatedData.phone ? { phone: validatedData.phone } : {},
                  validatedData.email ? { email: validatedData.email } : {},
                ].filter((condition) => Object.keys(condition).length > 0),
              },
            ],
          },
        });

        if (conflictingCustomer) {
          return res.status(400).json({
            error: "Another customer with this phone or email already exists",
          });
        }
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: validatedData,
      });

      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  }
);

// GET /api/customers/search - Search customers (Reception only)
router.get(
  "/search",
  requireAuth,
  requireReception,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      res.json(customers);
    } catch (error) {
      console.error("Error searching customers:", error);
      res.status(500).json({ error: "Failed to search customers" });
    }
  }
);

export default router;
