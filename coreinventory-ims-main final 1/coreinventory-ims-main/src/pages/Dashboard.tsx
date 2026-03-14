import { useState, useMemo } from "react";
import PageWrapper from "@/components/PageWrapper";
import { Package, AlertTriangle, ClipboardCheck, Truck, ArrowLeftRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseData } from "@/hooks/useSupabaseData";

export default function Dashboard() {
  const { products, stock, receipts, deliveries, transfers, ledger, warehouses, locations, categories, loading } = useSupabaseData();
  const [whFilter, setWhFilter] = useState("all");
  const [locFilter, setLocFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStock = useMemo(() => {
    return stock.filter(s => {
      if (whFilter !== "all" && s.warehouse_name !== whFilter) return false;
      if (locFilter !== "all" && s.location_id !== locFilter) return false;
      return true;
    });
  }, [stock, whFilter, locFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (catFilter !== "all" && p.category_id !== catFilter) return false;
      const productStock = filteredStock.filter(s => s.product_id === p.id);
      if ((whFilter !== "all" || locFilter !== "all") && productStock.length === 0) return false;
      return true;
    }).map(p => {
      const totalStock = filteredStock.filter(s => s.product_id === p.id).reduce((sum, s) => sum + s.quantity, 0);
      return { ...p, total_stock: totalStock };
    });
  }, [products, catFilter, filteredStock, whFilter, locFilter]);

  const lowStock = filteredProducts.filter(p => (p.total_stock || 0) <= p.min_stock);
  const pendingReceipts = receipts.filter(r => r.status === "pending");
  const pendingDeliveries = deliveries.filter(d => d.status !== "completed" && d.status !== "cancelled");
  const pendingTransfers = transfers.filter(t => t.status === "pending");

  const kpis = [
    { label: "Total Products", value: filteredProducts.length, icon: Package, color: "text-primary" },
    { label: "Low Stock Items", value: lowStock.length, icon: AlertTriangle, color: "text-destructive", alert: lowStock.length > 0 },
    { label: "Pending Receipts", value: pendingReceipts.length, icon: ClipboardCheck, color: "text-primary" },
    { label: "Pending Deliveries", value: pendingDeliveries.length, icon: Truck, color: "text-primary" },
    { label: "Pending Transfers", value: pendingTransfers.length, icon: ArrowLeftRight, color: "text-primary" },
  ];

  const topProducts = [...filteredProducts]
    .sort((a, b) => (b.total_stock || 0) - (a.total_stock || 0))
    .slice(0, 5)
    .map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name, stock: p.total_stock || 0 }));

  const filteredLedger = ledger.filter(m => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    return true;
  }).slice(0, 10);

  const typeIcon: Record<string, string> = { receipt: "📥", delivery: "📤", transfer: "🔄", adjustment: "📋" };

  if (loading) return <PageWrapper><div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></PageWrapper>;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Inventory Overview</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={whFilter} onValueChange={setWhFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Warehouses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={locFilter} onValueChange={setLocFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="delivery">Deliveries</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</span>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </div>
            <span className={`text-2xl font-bold ${k.alert ? "text-destructive" : "text-foreground"}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 kpi-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Top 5 Products by Stock</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 16%, 47%)" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220, 13%, 91%)", fontSize: 13 }} />
              <Bar dataKey="stock" fill="hsl(175, 84%, 32%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="kpi-card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {filteredLedger.length === 0 && <p className="text-sm text-muted-foreground">No movements recorded.</p>}
            {filteredLedger.map(m => (
              <div key={m.id} className="flex items-start gap-3 text-sm border-b border-border pb-2 last:border-0">
                <span className="text-base mt-0.5">{typeIcon[m.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{m.reference} — {m.product_name}</p>
                  <p className="text-xs text-muted-foreground">{m.quantity > 0 ? "+" : ""}{m.quantity} units · {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
