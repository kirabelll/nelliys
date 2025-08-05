import { Router } from "express";
import { z } from "zod";
import prisma from "../../prisma";
import { requireAuth, requireAnyRole, requireChef } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// Validation schemas
const updateUserRoleSchema = z.object({
  role: z.enum(["RECEPTION", "CHEF", "CASHIER", "SUPER_ADMIN"], {
    message: "Role must be RECEPTION, CHEF, CASHIER, or SUPER_ADMIN",
  }),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["RECEPTION", "CHEF", "CASHIER", "SUPER_ADMIN"]).default("RECEPTION"),
});

// GET /api/users - List all users (any authenticated user can see this)
router.get(
  "/",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Don't include sensitive fields
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// PUT /api/users/:id/role - Update user role (any authenticated user can do this for now)
router.put(
  "/:id/role",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role: validatedData.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// POST /api/users - Create new user with specific role (any authenticated user can do this)
router.post(
  "/",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = createUserSchema.parse(req.body);

      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      // For now, we'll create the user record directly in the database
      // In a real app, you'd want to use Better Auth's user creation methods
      const newUser = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          name: validatedData.name,
          email: validatedData.email,
          emailVerified: false,
          role: validatedData.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Also create an account record for email/password auth
      await prisma.account.create({
        data: {
          id: `account_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          accountId: newUser.id,
          providerId: "credential",
          userId: newUser.id,
          password: validatedData.password, // In production, this should be hashed
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// GET /api/users/me - Get current user info
router.get(
  "/me",
  requireAuth,
  requireAnyRole,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  }
);

// Debug endpoint to test database connection
router.get("/debug/db-test", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();

    res.json({
      message: "Database connection successful",
      userCount,
      accountCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Debug endpoint to test auth endpoints
router.get("/debug/auth-test", async (req, res) => {
  try {
    // Test if we can access the auth object
    const authInfo = {
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      trustedOrigins: process.env.CORS_ORIGIN || "http://localhost:3001",
      hasEmailPassword: true,
      timestamp: new Date().toISOString(),
    };

    res.json({
      message: "Auth configuration loaded",
      config: authInfo,
    });
  } catch (error) {
    console.error("Auth configuration error:", error);
    res.status(500).json({
      error: "Auth configuration failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test endpoint for Chef authentication
router.get(
  "/debug/chef-test",
  requireAuth,
  requireChef,
  async (req: AuthenticatedRequest, res) => {
    try {
      res.json({
        message: "Chef authentication successful!",
        user: req.user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Chef test error:", error);
      res.status(500).json({
        error: "Chef test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Manual signin endpoint
router.post("/signin", async (req, res) => {
  try {
    console.log("Signin request received:", { email: req.body.email });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("Validation failed: missing fields");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: {
            providerId: "credential",
          },
        },
      },
    });

    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password (in production, this should be hashed comparison)
    const account = user.accounts[0];
    if (!account || account.password !== password) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("User authenticated successfully:", user.id);

    // Create a simple session token (in production, use proper JWT or session management)
    const sessionToken = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create session in database
    await prisma.session.create({
      data: {
        id: `session_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Session created successfully:", sessionToken);

    res.json({
      message: "Signed in successfully",
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Manual signup endpoint as fallback
router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request received:", { body: req.body });

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log("Validation failed: missing fields");
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      console.log("Validation failed: password too short");
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create user directly using Prisma (simpler approach)
    const userId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const accountId = `account_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    console.log("Creating user with ID:", userId);

    // Get role from request body, default to RECEPTION
    const { role = "RECEPTION" } = req.body;

    // Create user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: false,
        role: role as "RECEPTION" | "CHEF" | "CASHIER" | "SUPER_ADMIN",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("User created successfully:", newUser.id);

    // Create account for email/password auth
    await prisma.account.create({
      data: {
        id: accountId,
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password, // In production, this should be hashed
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Account created successfully:", accountId);

    res.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
