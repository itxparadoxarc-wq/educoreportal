import { useState, useEffect } from "react";
import { GraduationCap, Eye, EyeOff, Shield, Lock, AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState<boolean | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, role, isLoading: authLoading } = useAuth();

  // Check if this is first-time setup (no users exist)
  useEffect(() => {
    const checkFirstTimeSetup = async () => {
      try {
        // Check if any user_roles exist (indicating there are admin users)
        const { count, error } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true });
        
        if (error) {
          console.error("Error checking setup status:", error);
          setIsFirstTimeSetup(false);
          return;
        }
        
        setIsFirstTimeSetup(count === 0);
      } catch (err) {
        console.error("Error checking setup status:", err);
        setIsFirstTimeSetup(false);
      }
    };

    checkFirstTimeSetup();
  }, []);

  // Redirect if already authenticated with a role
  useEffect(() => {
    if (user && role) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, role, navigate, location.state]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (isFirstTimeSetup && password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      }
      return false;
    }
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create the first master admin account
      const { data, error: signUpError } = await signUp(email.trim(), password, "Master Admin");
      
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Assign master_admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "master_admin" });

        if (roleError) {
          setError("Account created but failed to assign admin role: " + roleError.message);
          setIsLoading(false);
          return;
        }

        setSetupComplete(true);
        setIsFirstTimeSetup(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isFirstTimeSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">EduCore</h1>
            <p className="text-sm text-muted-foreground">Internal System</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            {isFirstTimeSetup ? (
              <>
                Welcome to
                <br />
                EduCore
                <br />
                Setup
              </>
            ) : (
              <>
                Secure Student
                <br />
                Information
                <br />
                Management
              </>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            {isFirstTimeSetup
              ? "Create your master admin account to get started with EduCore Internal System."
              : "A private, high-security system for managing student data, academics, fees, and institutional operations."}
          </p>

          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 text-success" />
              <span>Role-Based Access</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-5 w-5 text-success" />
              <span>Session Security</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          © 2026 EduCore Internal. Authorized personnel only.
        </p>
      </div>

      {/* Right Panel - Login/Setup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">EduCore</h1>
              <p className="text-sm text-muted-foreground">Internal System</p>
            </div>
          </div>

          {setupComplete ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold">Setup Complete!</h2>
                <p className="text-muted-foreground">
                  Your master admin account has been created. You can now sign in.
                </p>
                <Button
                  className="w-full py-6 text-base font-semibold"
                  onClick={() => setSetupComplete(false)}
                >
                  Sign In Now
                </Button>
              </div>
            </div>
          ) : isFirstTimeSetup ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">First Time Setup</h2>
                <p className="text-muted-foreground mt-2">
                  Create your master admin account
                </p>
              </div>

              <form onSubmit={handleFirstTimeSetup} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourschool.edu"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Master Admin Account"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  This account will have full system access
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Staff Login</h2>
                <p className="text-muted-foreground mt-2">
                  Sign in with your credentials
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@educore.local"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Protected by session timeout (30 min)</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isFirstTimeSetup
              ? "You'll be able to add more staff accounts after setup"
              : "Contact your administrator for account access"}
          </p>
        </div>
      </div>
    </div>
  );
}
