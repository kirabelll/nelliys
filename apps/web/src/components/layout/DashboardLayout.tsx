"use client";

import type { ReactNode } from "react";
import { authClient, type ExtendedUser } from "@/lib/auth-client";
import type { UserRole } from "@/types";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Coffee,
  Users,
  ShoppingCart,
  CreditCard,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const roleRoutes: Record<
  UserRole,
  Array<{ href: string; label: string; icon: React.ComponentType<any> }>
> = {
  RECEPTION: [
    { href: "/dashboard/reception", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/reception/customers", label: "Customers", icon: Users },
    {
      href: "/dashboard/reception/orders",
      label: "Orders",
      icon: ShoppingCart,
    },
    { href: "/dashboard/reception/users", label: "Users", icon: User },
  ],
  CASHIER: [
    { href: "/dashboard/cashier", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/cashier/orders", label: "Orders", icon: ShoppingCart },
    {
      href: "/dashboard/cashier/payments",
      label: "Payments",
      icon: CreditCard,
    },
  ],
  CHEF: [
    { href: "/dashboard/chef", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/chef/kitchen", label: "Kitchen", icon: ChefHat },
  ],
};

const roleColors: Record<UserRole, string> = {
  RECEPTION: "bg-blue-100 text-blue-800",
  CASHIER: "bg-green-100 text-green-800",
  CHEF: "bg-orange-100 text-orange-800",
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  if (!session?.user) {
    return null;
  }

  const userRole = (session.user as ExtendedUser).role;
  const routes = roleRoutes[userRole] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <Coffee className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Cafe Management</h1>
            <Badge variant="secondary" className={roleColors[userRole]}>
              {userRole}
            </Badge>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || undefined}
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <div className="space-y-1">
                {routes.map((route) => {
                  const Icon = route.icon;
                  const isActive = pathname === route.href;

                  return (
                    <Link key={route.href} href={route.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive && "bg-muted font-medium"
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {route.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
      </div>
    </div>
  );
}
