import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData, Product } from "@/hooks/useSupabaseData";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

const units = ["pcs", "kg", "m", "rolls", "liters", "boxes"];

export default function Products() {
  const { products, categories, stock, locations, warehouses, addProduct, updateProduct, deleteProduct } = useSupabaseData();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stockView, setStockView] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category_id: "", unit: "pcs", min_stock: 10 });

  const filtered = products.filter(p => p.sku.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", sku: "", category_id: categories[0]?.id || "", unit: "pcs", min_stock: 10 });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, category_id: p.category_id || "", unit: p.unit, min_stock: p.min_stock });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku) { toast.error("Name and SKU required"); return; }
    if (editing) {
      await updateProduct(editing.id, form);
      toast.success(`Product ${form.sku} updated`);
    } else {
      await addProduct({ ...form, category_id: form.category_id || null });
      toast.success(`Product ${form.sku} created`);
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      const p = products.find(x => x.id === confirmDelete);
      await deleteProduct(confirmDelete);
      toast.success(`Product ${p?.sku} deleted`);
      setConfirmDelete(null);
    }
  };

  const productStock = stockView ? stock.filter(s => s.product_id === stockView) : [];
  const viewProduct = stockView ? products.find(p => p.id === stockView) : null;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by SKU or name…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Min (Reorder)</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No products found.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-secondary/50 transition-all duration-200">
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category_name}</td>
                <td className={`px-4 py-3 text-right font-semibold ${(p.total_stock || 0) <= p.min_stock ? "text-destructive" : "text-foreground"}`}>
                  {p.total_stock || 0} {p.unit}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{p.min_stock}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setStockView(p.id)} title="View stock breakdown"><MapPin className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>SKU</Label><Input className="mt-1" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Min Stock (Reorder Threshold)</Label>
              <Input className="mt-1" type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: +e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Breakdown Modal */}
      <Dialog open={!!stockView} onOpenChange={() => setStockView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Stock Breakdown — {viewProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {productStock.length === 0 && <p className="text-sm text-muted-foreground">No stock entries for this product.</p>}
            {productStock.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.location_name}</p>
                  <p className="text-xs text-muted-foreground">{s.warehouse_name}</p>
                </div>
                <span className="font-semibold text-foreground">{s.quantity} {viewProduct?.unit}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="font-bold text-foreground">{productStock.reduce((s, e) => s + e.quantity, 0)} {viewProduct?.unit}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. Are you sure?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
