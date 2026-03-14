import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) { toast.error(error.message); return; }
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgot(false);
        return;
      }
      if (isRegister) {
        if (!name || !email || !password) { toast.error("All fields required"); return; }
        const { error } = await signUp(email, password, name);
        if (error) { toast.error(error.message); return; }
        toast.success("Account created! Check your email to confirm, or sign in.");
        navigate("/dashboard");
      } else {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error.message); return; }
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="kpi-card p-8">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">CoreInventory</h1>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1 text-center">Reset Password</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Enter your email and we'll send you a reset link</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send Reset Link"}</Button>
            </form>
            <p className="text-sm text-center mt-4 text-muted-foreground">
              <button onClick={() => setIsForgot(false)} className="text-primary font-medium hover:underline">Back to Sign In</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="kpi-card p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CoreInventory</h1>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1 text-center">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isRegister ? "Sign up to get started" : "Sign in to your account"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-1" />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            {!isRegister && (
              <div className="text-right">
                <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}</Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-medium hover:underline">
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
