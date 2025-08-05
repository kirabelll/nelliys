"use client";

import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to role-specific dashboard
    if (user) {
      const dashboardPath = user.role === 'CASHIER' ? '/dashboard/cashier' : 
                           user.role === 'CHEF' ? '/dashboard/chef' : 
                           '/dashboard/reception';
      router.push(dashboardPath);
    }
  }, [user, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p>Taking you to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
