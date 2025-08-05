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
import { useRouter } from "next/navigation";
import { Coffee, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const router = useRouter();
  const { setAuth } = useAuth();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/users/signin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: value.email,
            password: value.password,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          const token = data.token;
          const userRole = user.role || "RECEPTION";
          
          // Set auth data using context
          setAuth(user, token);
          
          let dashboardPath = "/dashboard";

          // Route to role-specific dashboard
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
            case "SUPER_ADMIN":
              dashboardPath = "/dashboard/admin";
              break;
            default:
              dashboardPath = "/dashboard/reception";
          }

          router.push(dashboardPath);
          toast.success(
            `Welcome back! Signed in as ${userRole.toLowerCase()}.`
          );
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Sign in failed");
        }
      } catch (error) {
        console.error("Sign in error:", error);
        toast.error("Network error. Please check your connection and try again.");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
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
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your cafe management account to continue
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
                      placeholder="Enter your password"
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
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={onSwitchToSignUp}
                className="p-0 h-auto font-medium text-primary hover:underline"
              >
                Create one here
              </Button>
            </p>
          </div>

          {/* Demo Credentials */}
        </CardContent>
      </Card>
    </div>
  );
}
