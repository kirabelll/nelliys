"use client";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, type UserRole } from "@/lib/auth-client";

function LoginContent() {
  const [showSignIn, setShowSignIn] = useState(true); // Default to sign in
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Check URL params for mode
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setShowSignIn(false);
    } else {
      setShowSignIn(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already logged in
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

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render forms if user is already logged in
  if (session?.user) {
    return null;
  }

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
