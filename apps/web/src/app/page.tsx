"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient, type UserRole } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Coffee,
  Users,
  ShoppingCart,
  CreditCard,
  ChefHat,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Type assertion for the user object with additional fields
      const user = session.user as typeof session.user & { role: UserRole };
      const userRole = user.role || "RECEPTION";
      let dashboardPath = "/dashboard";

      switch (userRole) {
        case "RECEPTION":
          dashboardPath = "/dashboard/reception";
          break;
        case "CASHIER":
          dashboardPath = "/dashboard/cashier";
          break;
        case "CHEF":
          dashboardPath = "/dashboard/chef";
          break;
        default:
          dashboardPath = "/dashboard/reception";
      }

      router.push(dashboardPath);
    }
  }, [session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 bg-primary/10 rounded-full">
              <Coffee className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Cafe Management
              <span className="block text-primary">System</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your cafe operations with our comprehensive management
              system. Handle orders, customers, and payments with ease.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg">
            Powerful features designed for modern cafe management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle>Reception Management</CardTitle>
              <CardDescription>
                Register customers and create orders efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Customer registration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Order creation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Customer database
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle>Cashier Operations</CardTitle>
              <CardDescription>
                Handle payments and order confirmations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Payment processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Order confirmation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Receipt generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <CardTitle>Kitchen Management</CardTitle>
              <CardDescription>
                Track orders and manage food preparation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Order tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Status updates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Kitchen display
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Roles Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Role-Based Access</h2>
          <p className="text-muted-foreground text-lg">
            Different interfaces for different team members
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-4">
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-lg px-4 py-2"
            >
              Reception
            </Badge>
            <p className="text-muted-foreground">
              Front desk operations, customer management, and order creation
            </p>
          </div>

          <div className="text-center space-y-4">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 text-lg px-4 py-2"
            >
              Cashier
            </Badge>
            <p className="text-muted-foreground">
              Payment processing, order confirmation, and checkout management
            </p>
          </div>

          <div className="text-center space-y-4">
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 text-lg px-4 py-2"
            >
              Chef
            </Badge>
            <p className="text-muted-foreground">
              Kitchen operations, order preparation, and status updates
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="text-center p-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of cafes already using our management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center mt-6 space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                Trusted by 500+ cafes worldwide
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
