import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../../prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:3001"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable email verification for now
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "RECEPTION",
        input: true, // Allow setting role during registration
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
