import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) { toast.error(typeof error === "string" ? error : error.message); return; }
      toast.success("Password updated! Redirecting to dashboard…");
      setTimeout(() => navigate("/dashboard"), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="kpi-card p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CoreInventory</h1>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1 text-center">Set New Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your new password below</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-foreground">New Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirm" className="text-foreground">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating…" : "Update Password"}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
