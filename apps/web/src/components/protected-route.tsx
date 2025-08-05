'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on user role
        let dashboardPath = '/dashboard/reception';
        switch (user.role) {
          case 'CASHIER':
            dashboardPath = '/dashboard/cashier';
            break;
          case 'CHEF':
            dashboardPath = '/dashboard/chef';
            break;
          case 'SUPER_ADMIN':
            dashboardPath = '/dashboard/admin';
            break;
          case 'RECEPTION':
          default:
            dashboardPath = '/dashboard/reception';
            break;
        }
        router.push(dashboardPath);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-32 w-96" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect to appropriate dashboard
  }

  return <>{children}</>;
}