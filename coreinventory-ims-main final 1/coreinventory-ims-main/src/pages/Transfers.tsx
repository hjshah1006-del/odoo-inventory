import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import StatusBadge from "@/components/StatusBadge";
import { Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Transfers() {
  const { transfers, products, locations, addTransfer, validateTransfer } = useSupabaseData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ from: "", to: "", product_id: "", qty: 0 });

  const handleCreate = async () => {
    if (!form.from || !form.to || !form.product_id || form.qty <= 0) { toast.error("Fill all fields"); return; }
    if (form.from === form.to) { toast.error("Source and destination must differ"); return; }
    await addTransfer(form.from, form.to, [{ product_id: form.product_id, quantity: form.qty }]);
    toast.success("Transfer created");
    setOpen(false);
  };

  const handleValidate = async (id: string) => {
    const t = transfers.find(x => x.id === id);
    await validateTransfer(id);
    toast.success(`Transfer ${t?.reference} validated`);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Internal Transfers</h1>
        <Button onClick={() => { setForm({ from: locations[0]?.id || "", to: locations[1]?.id || "", product_id: "", qty: 0 }); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Transfer</Button>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">To</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Items</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No transfers found.</td></tr>}
            {transfers.map(t => (
              <tr key={t.id} className="border-b border-border hover:bg-secondary/50 transition-all duration-200">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{t.reference}</td>
                <td className="px-4 py-3 text-foreground">{t.from_name}</td>
                <td className="px-4 py-3 text-foreground">{t.to_name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.lines?.map(i => `${i.product_name} (${i.quantity})`).join(", ")}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-right">
                  {t.status === "pending" && (
                    <Button size="sm" onClick={() => handleValidate(t.id)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Validate
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
          <DialogHeader><DialogTitle>New Internal Transfer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Location</Label>
                <Select value={form.from} onValueChange={v => setForm({ ...form, from: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.warehouse_name})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Location</Label>
                <Select value={form.to} onValueChange={v => setForm({ ...form, to: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.warehouse_name})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantity</Label><Input className="mt-1" type="number" value={form.qty} onChange={e => setForm({ ...form, qty: +e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Transfer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
