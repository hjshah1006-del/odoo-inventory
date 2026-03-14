import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MoveHistory() {
  const { ledger } = useSupabaseData();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const perPage = 15;

  const filtered = filter === "all" ? ledger : ledger.filter(m => m.type === filter);
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  const typeLabel: Record<string, string> = { receipt: "📥 Receipt", delivery: "📤 Delivery", transfer: "🔄 Transfer", adjustment: "📋 Adjustment" };

  return (
    <PageWrapper>
      <div className="page-header">
        <h1 className="page-title">Move History</h1>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="delivery">Deliveries</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">To</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No movements recorded.</td></tr>}
            {pageData.map(m => (
              <tr key={m.id} className="border-b border-border hover:bg-secondary/50 transition-all duration-200">
                <td className="px-4 py-3 text-sm">{typeLabel[m.type]}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold">{m.reference}</td>
                <td className="px-4 py-3 text-foreground">{m.product_name}</td>
                <td className={`px-4 py-3 text-right font-semibold ${m.quantity < 0 ? "text-destructive" : "text-primary"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{m.from_location}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{m.to_location}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm rounded-md bg-secondary text-foreground disabled:opacity-40 hover:bg-secondary/80 transition-colors">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm rounded-md bg-secondary text-foreground disabled:opacity-40 hover:bg-secondary/80 transition-colors">Next</button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
