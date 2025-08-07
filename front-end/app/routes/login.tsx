import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";

export function meta() {
  return [
    { title: "Login - Todo App" },
    { name: "description", content: "Login to your Todo App account" },
  ];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simple validation
    if (!email || !password) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      // Navigation is handled in the login function
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      if (err.message === "User not found") {
        toast.error("User not found");
      } else {
        toast.error(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full space-y-8">
        <CardHeader>
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="mt-6 text-3xl font-bold text-gray-900 text-center">Welcome back</CardTitle>
          <p className="mt-2 text-sm text-gray-600 text-center">Sign in to your account to continue</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-12"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 h-full px-3"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </Button>
              </div>
            </div>
            <div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <div className="flex items-center">
                    <Skeleton className="w-4 h-4 rounded-full mr-2" /> Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Sign up</a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 