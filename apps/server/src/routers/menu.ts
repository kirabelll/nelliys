import { Router } from "express";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma";
import { requireAuth, requireAnyRole } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { emitMenuUpdate } from "../lib/socket";

const router: Router = Router();
// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

// GET /api/menu/categories - List all categories
router.get("/categories", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/menu/categories - Create new category (Admin only for now)
router.post("/categories", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // Check for existing category with same name
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: { equals: validatedData.name, mode: "insensitive" },
        isActive: true 
      },
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: "Category with this name already exists" 
      });
    }

    const category = await prisma.category.create({
      data: validatedData,
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// GET /api/menu/items - List all menu items
router.get("/items", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { categoryId, available } = req.query;

    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    if (available !== undefined) {
      where.isAvailable = available === "true";
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { name: "asc" } },
        { name: "asc" },
      ],
    });

    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// POST /api/menu/items - Create new menu item
router.post("/items", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createMenuItemSchema.parse(req.body);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Check for existing item with same name in the same category
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        name: { equals: validatedData.name, mode: "insensitive" },
        categoryId: validatedData.categoryId,
      },
    });

    if (existingItem) {
      return res.status(400).json({ 
        error: "Menu item with this name already exists in this category" 
      });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        ...validatedData,
        price: new Decimal(validatedData.price),
      },
      include: {
        category: true,
      },
    });

    // Emit real-time event for menu update
    emitMenuUpdate(menuItem);
    
    res.status(201).json(menuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

// GET /api/menu/items/:id - Get menu item by ID
router.get("/items/:id", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({ error: "Failed to fetch menu item" });
  }
});

// PUT /api/menu/items/:id - Update menu item
router.put("/items/:id", requireAuth, requireAnyRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateMenuItemSchema.parse(req.body);

    // Check if menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // If updating category, check if it exists
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return res.status(400).json({ error: "Category not found" });
      }
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name) {
      const conflictingItem = await prisma.menuItem.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { name: { equals: validatedData.name, mode: "insensitive" } },
            { categoryId: validatedData.categoryId || existingItem.categoryId },
          ],
        },
      });

      if (conflictingItem) {
        return res.status(400).json({ 
          error: "Menu item with this name already exists in this category" 
        });
      }
    }

    const updateData: any = { ...validatedData };
    if (validatedData.price) {
      updateData.price = new Decimal(validatedData.price);
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    res.json(menuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

export default router;