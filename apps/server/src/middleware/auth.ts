import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try Better Auth first
    try {
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      if (session) {
        req.user = session.user as any;
        return next();
      }
    } catch (betterAuthError) {
      console.log("Better Auth session check failed, trying custom session");
    }

    // Fallback to custom session system
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace("Bearer ", "");

    if (!sessionToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Import prisma here to avoid circular dependency
    const prisma = (await import("../../prisma")).default;

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Invalid authentication" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// Role-specific middleware
export const requireReception = requireRole(["RECEPTION"]);
export const requireCashier = requireRole(["CASHIER"]);
export const requireChef = requireRole(["CHEF"]);
export const requireReceptionOrCashier = requireRole(["RECEPTION", "CASHIER"]);
export const requireAnyRole = requireRole(["RECEPTION", "CASHIER", "CHEF", "SUPER_ADMIN"]);
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);
