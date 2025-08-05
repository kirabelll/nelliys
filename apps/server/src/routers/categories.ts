import { Router } from "express";
import { z } from "zod";
import prisma from "../../prisma";
import { requireAuth, requireChef } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/categories - List all categories (public endpoint)
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
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

// GET /api/categories/:id - Get single category
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: {
          orderBy: { name: "asc" },
        },
        _count: {
          select: { menuItems: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// POST /api/categories - Create new category (Chef only)
router.post("/", requireAuth, requireChef, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // Check if category with same name exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res.status(400).json({ error: "Category with this name already exists" });
    }

    // Create category
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

// PUT /api/categories/:id - Update category (Chef only)
router.put("/:id", requireAuth, requireChef, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // If name is being updated, check for conflicts
    if (validatedData.name) {
      const conflictingCategory = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              name: {
                equals: validatedData.name,
                mode: "insensitive",
              },
            },
          ],
        },
      });

      if (conflictingCategory) {
        return res.status(400).json({ error: "Another category with this name already exists" });
      }
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

export default router;