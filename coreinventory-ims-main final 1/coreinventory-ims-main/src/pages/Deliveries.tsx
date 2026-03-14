import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import StatusBadge from "@/components/StatusBadge";
import { Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const stepLabel: Record<string, string> = {
  draft: "Start Picking",
  picking: "Start Packing",
  packing: "Validate & Ship",
};

export default function Deliveries() {
  const { deliveries, products, warehouses, locations, addDelivery, advanceDelivery } = useSupabaseData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", warehouse_id: "", product_id: "", location_id: "", qty: 0 });

  const whLocations = locations.filter(l => l.warehouse_id === form.warehouse_id);

  const handleCreate = async () => {
    if (!form.customer || !form.product_id || !form.location_id || form.qty <= 0) { toast.error("Fill all fields"); return; }
    await addDelivery(form.customer, form.warehouse_id, [{ product_id: form.product_id, location_id: form.location_id, quantity: form.qty }]);
    toast.success("Delivery order created");
    setOpen(false);
    setForm({ customer: "", warehouse_id: "", product_id: "", location_id: "", qty: 0 });
  };

  const handleAdvance = async (id: string) => {
    const d = deliveries.find(x => x.id === id);
    await advanceDelivery(id);
    const nextMap: Record<string, string> = { draft: "picking", picking: "packing", packing: "completed" };
    toast.success(`Delivery ${d?.reference} → ${nextMap[d?.status || ""]}`);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Delivery Orders</h1>
        <Button onClick={() => { setForm({ customer: "", warehouse_id: warehouses[0]?.id || "", product_id: "", location_id: "", qty: 0 }); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Delivery</Button>
      </div>

      {/* 3-step visual */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <span className="px-2 py-1 rounded bg-secondary">Draft</span>
        <ArrowRight className="h-3 w-3" />
        <span className="px-2 py-1 rounded bg-secondary">Picking</span>
        <ArrowRight className="h-3 w-3" />
        <span className="px-2 py-1 rounded bg-secondary">Packing</span>
        <ArrowRight className="h-3 w-3" />
        <span className="px-2 py-1 rounded bg-secondary">Completed</span>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Warehouse</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Items</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No delivery orders found.</td></tr>}
            {deliveries.map(d => (
              <tr key={d.id} className="border-b border-border hover:bg-secondary/50 transition-all duration-200">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{d.reference}</td>
                <td className="px-4 py-3 text-foreground">{d.customer}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.warehouse_name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{d.lines?.map(i => `${i.product_name} (${i.quantity})`).join(", ")}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-right">
                  {stepLabel[d.status] && (
                    <Button size="sm" onClick={() => handleAdvance(d.id)}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />{stepLabel[d.status]}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Delivery Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Customer</Label><Input className="mt-1" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" /></div>
            <div>
              <Label>Warehouse</Label>
              <Select value={form.warehouse_id} onValueChange={v => setForm({ ...form, warehouse_id: v, location_id: "" })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={form.location_id} onValueChange={v => setForm({ ...form, location_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{whLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.total_stock} in stock</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantity</Label><Input className="mt-1" type="number" value={form.qty} onChange={e => setForm({ ...form, qty: +e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Delivery</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
