import { Router } from "express";
import { z } from "zod";
import prisma from "../../prisma";
import { requireAuth, requireAnyRole, requireChef } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// Validation schemas
const createMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  isAvailable: z.boolean().optional(),
});

// GET /api/menu-items - List all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// GET /api/menu-items/:id - Get single menu item
router.get("/:id", async (req, res) => {
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

// POST /api/menu-items - Create new menu item (Chef only)
router.post("/", requireAuth, requireChef, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createMenuItemSchema.parse(req.body);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        categoryId: validatedData.categoryId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(menuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error creating menu item:", error);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

// PUT /api/menu-items/:id - Update menu item (Chef only)
router.put("/:id", requireAuth, requireChef, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateMenuItemSchema.parse(req.body);

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingMenuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // If categoryId is being updated, check if it exists
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return res.status(400).json({ error: "Category not found" });
      }
    }

    // Update menu item
    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    res.json(updatedMenuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

// DELETE /api/menu-items/:id - Delete menu item (Chef only)
router.delete("/:id", requireAuth, requireChef, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if menu item exists
    const existingMenuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingMenuItem) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

// GET /api/menu-items/category/:categoryId - Get menu items by category
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const menuItems = await prisma.menuItem.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items by category:", error);
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

export default router;