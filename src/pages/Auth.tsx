import { useState, useEffect } from "react";
import { GraduationCap, Eye, EyeOff, Shield, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, role, isLoading: authLoading } = useAuth();

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
      if (isSignUp) {
        nameSchema.parse(fullName);
      }
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email.trim(), password, fullName.trim());
        if (error) {
          if (error.message.includes("already registered")) {
            setError("An account with this email already exists. Please sign in.");
          } else {
            setError(error.message);
          }
        } else {
          setSuccess("Account created! Please wait for the Master Admin to assign your role.");
          setIsSignUp(false);
          setPassword("");
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(error.message);
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
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
            Secure Student
            <br />
            Information
            <br />
            Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            A private, high-security system for managing student data,
            academics, fees, and institutional operations.
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

      {/* Right Panel - Login/Signup Form */}
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

          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isSignUp
                  ? "Register for staff access"
                  : "Sign in to access the admin dashboard"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-success/10 border border-success/30 text-success text-sm rounded-lg p-3">
                  {success}
                </div>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
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
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignUp
                    ? "Creating Account..."
                    : "Signing in..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setSuccess("");
                }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Register for access"}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Protected by session timeout (30 min)</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp
              ? "After registration, wait for Master Admin to assign your role"
              : "Contact Master Admin for account access"}
          </p>
        </div>
      </div>
    </div>
  );
}
