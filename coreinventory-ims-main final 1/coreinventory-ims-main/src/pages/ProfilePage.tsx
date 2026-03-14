import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Shield, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name || "");

  const handleSave = async () => {
    const { error } = await updateProfile({ full_name: name });
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated");
    setEditing(false);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>
      <div className="max-w-lg">
        <div className="kpi-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.role || "user"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><Mail className="h-3 w-3" />Email</Label>
              <p className="text-foreground mt-1">{user?.email || profile?.email}</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><User className="h-3 w-3" />Full Name</Label>
              {editing ? (
                <div className="flex gap-2 mt-1">
                  <Input value={name} onChange={e => setName(e.target.value)} />
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-foreground">{profile?.full_name || "—"}</p>
                  <Button variant="ghost" size="icon" onClick={() => { setName(profile?.full_name || ""); setEditing(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1"><Shield className="h-3 w-3" />Role</Label>
              <p className="text-foreground mt-1 capitalize">{profile?.role || "user"}</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
