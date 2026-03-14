import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Plus, Trash2, MapPin, Warehouse, Tag } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { warehouses, locations, categories, addWarehouse, deleteWarehouse, addLocation, deleteLocation, addCategory, deleteCategory } = useSupabaseData();
  const [whOpen, setWhOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", address: "" });
  const [catForm, setCatForm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);
  const [newLocation, setNewLocation] = useState<{ whId: string; name: string } | null>(null);

  const handleCreateWh = async () => {
    if (!whForm.name) { toast.error("Name required"); return; }
    await addWarehouse(whForm.name, whForm.address);
    toast.success(`Warehouse "${whForm.name}" created`);
    setWhOpen(false);
    setWhForm({ name: "", address: "" });
  };

  const handleCreateCat = async () => {
    if (!catForm) { toast.error("Name required"); return; }
    await addCategory(catForm);
    toast.success(`Category "${catForm}" created`);
    setCatOpen(false);
    setCatForm("");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "warehouse") {
      await deleteWarehouse(confirmDelete.id);
      toast.success("Warehouse deleted");
    } else if (confirmDelete.type === "location") {
      await deleteLocation(confirmDelete.id);
      toast.success("Location deleted");
    } else if (confirmDelete.type === "category") {
      await deleteCategory(confirmDelete.id);
      toast.success("Category deleted");
    }
    setConfirmDelete(null);
  };

  const handleAddLocation = async () => {
    if (!newLocation?.name || !newLocation.whId) return;
    await addLocation(newLocation.whId, newLocation.name);
    toast.success(`Location "${newLocation.name}" added`);
    setNewLocation(null);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Product Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Product Categories</h2>
          <Button size="sm" onClick={() => setCatOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Category</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground">
              {c.name}
              <button onClick={() => setConfirmDelete({ type: "category", id: c.id })} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Warehouses */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Warehouse className="h-5 w-5 text-primary" />Warehouses & Locations</h2>
        <Button size="sm" onClick={() => setWhOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Warehouse</Button>
      </div>

      <div className="space-y-4">
        {warehouses.map(w => {
          const whLocs = locations.filter(l => l.warehouse_id === w.id);
          return (
            <div key={w.id} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{w.name}</h3>
                  {w.address && <p className="text-xs text-muted-foreground">{w.address}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({ type: "warehouse", id: w.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {whLocs.map(l => (
                  <span key={l.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-sm text-foreground">
                    <MapPin className="h-3 w-3" />{l.name}
                    <button onClick={() => setConfirmDelete({ type: "location", id: l.id })} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setNewLocation({ whId: w.id, name: "" })}>
                <Plus className="h-3 w-3 mr-1" />Add Location
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Warehouse */}
      <Dialog open={whOpen} onOpenChange={setWhOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input className="mt-1" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} placeholder="e.g., Main Warehouse" /></div>
            <div><Label>Address</Label><Input className="mt-1" value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} placeholder="Optional address" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWhOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateWh}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Category Name</Label><Input className="mt-1" value={catForm} onChange={e => setCatForm(e.target.value)} placeholder="e.g., Electronics" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCat}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Location */}
      <Dialog open={!!newLocation} onOpenChange={() => setNewLocation(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Location Name</Label><Input className="mt-1" value={newLocation?.name || ""} onChange={e => setNewLocation(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="e.g., Rack D" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewLocation(null)}>Cancel</Button>
              <Button onClick={handleAddLocation}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
