import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createSimpleJWT } from "../lib/jwt-utils";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: Router = Router();

// GET /api/socket-token - Get JWT token for Socket.IO authentication
router.get(
  "/socket-token",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;

      const token = createSimpleJWT({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      res.json({ token });
    } catch (error) {
      console.error("Error generating socket token:", error);
      res.status(500).json({ error: "Failed to generate socket token" });
    }
  }
);

export default router;
