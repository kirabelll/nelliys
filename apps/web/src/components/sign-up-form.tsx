import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import { Coffee, User, Mail, Lock, Loader2, UserCheck } from "lucide-react";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "RECEPTION" as "RECEPTION" | "CHEF" | "CASHIER" | "SUPER_ADMIN",
    },
    onSubmit: async ({ value }) => {
      try {
        // Use the fallback endpoint as primary method for now
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/users/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: value.name,
            email: value.email,
            password: value.password,
            role: value.role,
          }),
        });
        
        if (response.ok) {
          toast.success("Account created successfully! Please sign in to continue.");
          onSwitchToSignIn();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Signup failed. Please try again.");
        }
      } catch (error) {
        console.error("Signup error:", error);
        toast.error("Network error. Please check your connection and try again.");
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["RECEPTION", "CHEF", "CASHIER", "SUPER_ADMIN"]),
      }),
    },
  });



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Coffee className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join our cafe management system and start managing your business
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your full name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={error?.message}
                        className="text-sm text-destructive"
                      >
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="Enter your email address"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={error?.message}
                        className="text-sm text-destructive"
                      >
                        {error?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="password">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="Create a secure password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={
                        field.state.meta.errors.length > 0
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={error?.message}
                        className="text-sm text-destructive"
                      >
                        {error?.message}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="role">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Role
                    </Label>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as "RECEPTION" | "CHEF" | "CASHIER" | "SUPER_ADMIN")}
                      onBlur={field.handleBlur}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        field.state.meta.errors.length > 0
                          ? "border-destructive"
                          : ""
                      }`}
                    >
                      <option value="RECEPTION">Reception - Manage customers and orders</option>
                      <option value="CHEF">Chef - Prepare orders and manage kitchen</option>
                      <option value="CASHIER">Cashier - Process payments and orders</option>
                      <option value="SUPER_ADMIN">Super Admin - Full system access</option>
                    </select>
                    {field.state.meta.errors.map((error) => (
                      <p
                        key={error?.message}
                        className="text-sm text-destructive"
                      >
                        {error?.message}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Choose the role that matches your responsibilities
                    </p>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={onSwitchToSignIn}
                className="p-0 h-auto font-medium text-primary hover:underline"
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
