import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import StatusBadge from "@/components/StatusBadge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Adjustments() {
  const { adjustments, products, stock, locations, addAdjustment } = useSupabaseData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", location_id: "", countedQty: 0, reason: "" });

  const selectedStock = stock.find(s => s.product_id === form.product_id && s.location_id === form.location_id);
  const recordedQty = selectedStock?.quantity || 0;
  const selectedProduct = products.find(p => p.id === form.product_id);

  const productLocations = stock.filter(s => s.product_id === form.product_id);

  const handleCreate = async () => {
    if (!form.product_id || !form.location_id) { toast.error("Select product and location"); return; }
    await addAdjustment(form.product_id, form.location_id, recordedQty, form.countedQty, form.reason);
    const diff = form.countedQty - recordedQty;
    toast.success(`Stock adjusted: ${diff > 0 ? "+" : ""}${diff}`);
    setOpen(false);
    setForm({ product_id: "", location_id: "", countedQty: 0, reason: "" });
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Stock Adjustments</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Adjustment</Button>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Location</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Recorded</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Counted</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Diff</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No adjustments recorded.</td></tr>}
            {adjustments.map(a => (
              <tr key={a.id} className="border-b border-border hover:bg-secondary/50 transition-all duration-200">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{a.reference}</td>
                <td className="px-4 py-3 text-foreground">{a.product_name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.location_name}</td>
                <td className="px-4 py-3 text-right">{a.recorded_qty}</td>
                <td className="px-4 py-3 text-right">{a.counted_qty}</td>
                <td className={`px-4 py-3 text-right font-semibold ${a.difference < 0 ? "text-destructive" : a.difference > 0 ? "text-primary" : ""}`}>
                  {a.difference > 0 ? "+" : ""}{a.difference}
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v, location_id: "", countedQty: 0 })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={form.location_id} onValueChange={v => { const s = stock.find(x => x.product_id === form.product_id && x.location_id === v); setForm({ ...form, location_id: v, countedQty: s?.quantity || 0 }); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {productLocations.map(s => <SelectItem key={s.location_id} value={s.location_id}>{s.location_name} — {s.quantity} in stock</SelectItem>)}
                  {locations.filter(l => !productLocations.some(pl => pl.location_id === l.id)).map(l => <SelectItem key={l.id} value={l.id}>{l.name} — 0 in stock</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.location_id && (
              <div className="p-3 rounded-md bg-secondary text-sm">
                <p className="text-foreground"><strong>Recorded Stock:</strong> {recordedQty} {selectedProduct?.unit}</p>
              </div>
            )}
            <div>
              <Label>Physical Count</Label>
              <Input className="mt-1" type="number" value={form.countedQty} onChange={e => setForm({ ...form, countedQty: +e.target.value })} />
            </div>
            <div>
              <Label>Reason</Label>
              <Input className="mt-1" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for adjustment" />
            </div>
            {form.location_id && (
              <p className="text-sm">
                Difference: <span className={`font-semibold ${form.countedQty - recordedQty < 0 ? "text-destructive" : "text-primary"}`}>
                  {form.countedQty - recordedQty > 0 ? "+" : ""}{form.countedQty - recordedQty}
                </span>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Apply Adjustment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
