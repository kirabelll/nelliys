import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
});

export type UserRole = "RECEPTION" | "CHEF" | "CASHIER";

// Type for our extended user with role
export interface ExtendedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role: UserRole;
}

// Type for session with extended user
export interface ExtendedSession {
  user: ExtendedUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
