"use client";

import { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    return fallback || (
      <div className="text-center p-8">
        <p className="text-gray-600">Please sign in to access this page.</p>
      </div>
    );
  }

  const userRole = session.user.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    return fallback || (
      <div className="text-center p-8">
        <p className="text-red-600">You don't have permission to access this page.</p>
        <p className="text-gray-600 mt-2">Required roles: {allowedRoles.join(", ")}</p>
        <p className="text-gray-600">Your role: {userRole}</p>
      </div>
    );
  }

  return <>{children}</>;
}