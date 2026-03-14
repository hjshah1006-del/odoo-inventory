import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Generic types matching Supabase schema
export interface Category { id: string; name: string; }
export interface Warehouse { id: string; name: string; address: string; }
export interface Location { id: string; warehouse_id: string; name: string; warehouse_name?: string; }
export interface Product { id: string; name: string; sku: string; category_id: string | null; unit: string; min_stock: number; category_name?: string; total_stock?: number; }
export interface StockEntry { id: string; product_id: string; location_id: string; quantity: number; location_name?: string; warehouse_name?: string; }
export interface Receipt { id: string; reference: string; supplier: string; warehouse_id: string; status: string; date: string; created_by: string | null; warehouse_name?: string; lines?: ReceiptLine[]; }
export interface ReceiptLine { id: string; receipt_id: string; product_id: string; location_id: string; quantity: number; product_name?: string; location_name?: string; }
export interface Delivery { id: string; reference: string; customer: string; warehouse_id: string; status: string; date: string; created_by: string | null; warehouse_name?: string; lines?: DeliveryLine[]; }
export interface DeliveryLine { id: string; delivery_id: string; product_id: string; location_id: string; quantity: number; product_name?: string; location_name?: string; }
export interface Transfer { id: string; reference: string; from_location_id: string; to_location_id: string; status: string; date: string; created_by: string | null; from_name?: string; to_name?: string; lines?: TransferLine[]; }
export interface TransferLine { id: string; transfer_id: string; product_id: string; quantity: number; product_name?: string; }
export interface Adjustment { id: string; reference: string; product_id: string; location_id: string; recorded_qty: number; counted_qty: number; difference: number; reason: string; status: string; date: string; product_name?: string; location_name?: string; }
export interface LedgerEntry { id: string; type: string; reference: string; product_id: string; location_id: string | null; quantity: number; from_location: string; to_location: string; notes: string; created_at: string; product_name?: string; }

async function getNextRef(prefix: string): Promise<string> {
  const { data } = await supabase.from("ref_sequences").select("last_number").eq("prefix", prefix).single();
  const next = (data?.last_number || 1000) + 1;
  await supabase.from("ref_sequences").upsert({ prefix, last_number: next });
  return `${prefix}-${next}`;
}

export function useSupabaseData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [catRes, whRes, locRes, prodRes, stockRes, rcRes, rcLinesRes, delRes, delLinesRes, trRes, trLinesRes, adjRes, ledRes] = await Promise.all([
      supabase.from("product_categories").select("*").order("name"),
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("locations").select("*, warehouses(name)").order("name"),
      supabase.from("products").select("*, product_categories(name)").order("name"),
      supabase.from("stock").select("*, locations(name, warehouses(name))"),
      supabase.from("receipts").select("*, warehouses(name)").order("created_at", { ascending: false }),
      supabase.from("receipt_lines").select("*, products(name), locations(name)"),
      supabase.from("deliveries").select("*, warehouses(name)").order("created_at", { ascending: false }),
      supabase.from("delivery_lines").select("*, products(name), locations(name)"),
      supabase.from("transfers").select("*").order("created_at", { ascending: false }),
      supabase.from("transfer_lines").select("*, products(name)"),
      supabase.from("adjustments").select("*, products(name), locations(name)").order("created_at", { ascending: false }),
      supabase.from("stock_ledger").select("*, products(name)").order("created_at", { ascending: false }),
    ]);

    setCategories(catRes.data || []);
    setWarehouses(whRes.data || []);

    const locs = (locRes.data || []).map((l: any) => ({ ...l, warehouse_name: l.warehouses?.name || "" }));
    setLocations(locs);

    const stockData = (stockRes.data || []).map((s: any) => ({
      ...s,
      location_name: s.locations?.name || "",
      warehouse_name: s.locations?.warehouses?.name || "",
    }));
    setStock(stockData);

    const prods = (prodRes.data || []).map((p: any) => {
      const totalStock = stockData.filter((s: any) => s.product_id === p.id).reduce((sum: number, s: any) => sum + s.quantity, 0);
      return { ...p, category_name: p.product_categories?.name || "", total_stock: totalStock };
    });
    setProducts(prods);

    const rcLines = (rcLinesRes.data || []).map((l: any) => ({ ...l, product_name: l.products?.name || "", location_name: l.locations?.name || "" }));
    const rcs = (rcRes.data || []).map((r: any) => ({ ...r, warehouse_name: r.warehouses?.name || "", lines: rcLines.filter((l: any) => l.receipt_id === r.id) }));
    setReceipts(rcs);

    const dlLines = (delLinesRes.data || []).map((l: any) => ({ ...l, product_name: l.products?.name || "", location_name: l.locations?.name || "" }));
    const dels = (delRes.data || []).map((d: any) => ({ ...d, warehouse_name: d.warehouses?.name || "", lines: dlLines.filter((l: any) => l.delivery_id === d.id) }));
    setDeliveries(dels);

    const tLines = (trLinesRes.data || []).map((l: any) => ({ ...l, product_name: l.products?.name || "" }));
    const trs = (trRes.data || []).map((t: any) => {
      const fromLoc = locs.find((l: any) => l.id === t.from_location_id);
      const toLoc = locs.find((l: any) => l.id === t.to_location_id);
      return { ...t, from_name: fromLoc?.name || "", to_name: toLoc?.name || "", lines: tLines.filter((l: any) => l.transfer_id === t.id) };
    });
    setTransfers(trs);

    const adjs = (adjRes.data || []).map((a: any) => ({ ...a, product_name: a.products?.name || "", location_name: a.locations?.name || "" }));
    setAdjustments(adjs);

    const ledgerData = (ledRes.data || []).map((l: any) => ({ ...l, product_name: l.products?.name || "" }));
    setLedger(ledgerData);

    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // CRUD Operations
  const addCategory = async (name: string) => {
    await supabase.from("product_categories").insert({ name });
    await refresh();
  };
  const deleteCategory = async (id: string) => {
    await supabase.from("product_categories").delete().eq("id", id);
    await refresh();
  };

  const addWarehouse = async (name: string, address: string) => {
    await supabase.from("warehouses").insert({ name, address });
    await refresh();
  };
  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    await supabase.from("warehouses").update(updates).eq("id", id);
    await refresh();
  };
  const deleteWarehouse = async (id: string) => {
    await supabase.from("warehouses").delete().eq("id", id);
    await refresh();
  };

  const addLocation = async (warehouse_id: string, name: string) => {
    await supabase.from("locations").insert({ warehouse_id, name });
    await refresh();
  };
  const deleteLocation = async (id: string) => {
    await supabase.from("locations").delete().eq("id", id);
    await refresh();
  };

  const addProduct = async (p: { name: string; sku: string; category_id: string | null; unit: string; min_stock: number }) => {
    await supabase.from("products").insert(p);
    await refresh();
  };
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { category_name, total_stock, ...clean } = updates as any;
    await supabase.from("products").update(clean).eq("id", id);
    await refresh();
  };
  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    await refresh();
  };

  const addReceipt = async (supplier: string, warehouse_id: string, items: { product_id: string; location_id: string; quantity: number }[]) => {
    const ref = await getNextRef("RC");
    const { data } = await supabase.from("receipts").insert({ reference: ref, supplier, warehouse_id, status: "pending", date: new Date().toISOString().split("T")[0] }).select().single();
    if (data) {
      await supabase.from("receipt_lines").insert(items.map(i => ({ receipt_id: data.id, ...i })));
    }
    await refresh();
  };

  const validateReceipt = async (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt || receipt.status === "completed") return;
    await supabase.from("receipts").update({ status: "completed" }).eq("id", id);
    for (const line of (receipt.lines || [])) {
      await supabase.from("stock").upsert(
        { product_id: line.product_id, location_id: line.location_id, quantity: (stock.find(s => s.product_id === line.product_id && s.location_id === line.location_id)?.quantity || 0) + line.quantity },
        { onConflict: "product_id,location_id" }
      );
      await supabase.from("stock_ledger").insert({ type: "receipt", reference: receipt.reference, product_id: line.product_id, location_id: line.location_id, quantity: line.quantity, from_location: receipt.supplier, to_location: line.location_name || "", notes: "Validated receipt" });
    }
    await refresh();
  };

  const addDelivery = async (customer: string, warehouse_id: string, items: { product_id: string; location_id: string; quantity: number }[]) => {
    const ref = await getNextRef("DO");
    const { data } = await supabase.from("deliveries").insert({ reference: ref, customer, warehouse_id, status: "draft", date: new Date().toISOString().split("T")[0] }).select().single();
    if (data) {
      await supabase.from("delivery_lines").insert(items.map(i => ({ delivery_id: data.id, ...i })));
    }
    await refresh();
  };

  const advanceDelivery = async (id: string) => {
    const delivery = deliveries.find(d => d.id === id);
    if (!delivery) return;
    const nextStatus: Record<string, string> = { draft: "picking", picking: "packing", packing: "completed" };
    const next = nextStatus[delivery.status];
    if (!next) return;
    await supabase.from("deliveries").update({ status: next }).eq("id", id);
    if (next === "completed") {
      for (const line of (delivery.lines || [])) {
        const currentStock = stock.find(s => s.product_id === line.product_id && s.location_id === line.location_id);
        await supabase.from("stock").upsert(
          { product_id: line.product_id, location_id: line.location_id, quantity: Math.max(0, (currentStock?.quantity || 0) - line.quantity) },
          { onConflict: "product_id,location_id" }
        );
        await supabase.from("stock_ledger").insert({ type: "delivery", reference: delivery.reference, product_id: line.product_id, location_id: line.location_id, quantity: -line.quantity, from_location: line.location_name || "", to_location: delivery.customer, notes: "Validated delivery" });
      }
    }
    await refresh();
  };

  const addTransfer = async (from_location_id: string, to_location_id: string, items: { product_id: string; quantity: number }[]) => {
    const ref = await getNextRef("TR");
    const { data } = await supabase.from("transfers").insert({ reference: ref, from_location_id, to_location_id, status: "pending", date: new Date().toISOString().split("T")[0] }).select().single();
    if (data) {
      await supabase.from("transfer_lines").insert(items.map(i => ({ transfer_id: data.id, ...i })));
    }
    await refresh();
  };

  const validateTransfer = async (id: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer || transfer.status === "completed") return;
    await supabase.from("transfers").update({ status: "completed" }).eq("id", id);
    for (const line of (transfer.lines || [])) {
      const fromStock = stock.find(s => s.product_id === line.product_id && s.location_id === transfer.from_location_id);
      const toStock = stock.find(s => s.product_id === line.product_id && s.location_id === transfer.to_location_id);
      await supabase.from("stock").upsert({ product_id: line.product_id, location_id: transfer.from_location_id, quantity: Math.max(0, (fromStock?.quantity || 0) - line.quantity) }, { onConflict: "product_id,location_id" });
      await supabase.from("stock").upsert({ product_id: line.product_id, location_id: transfer.to_location_id, quantity: (toStock?.quantity || 0) + line.quantity }, { onConflict: "product_id,location_id" });
      await supabase.from("stock_ledger").insert({ type: "transfer", reference: transfer.reference, product_id: line.product_id, location_id: null, quantity: line.quantity, from_location: transfer.from_name || "", to_location: transfer.to_name || "", notes: "Validated transfer" });
    }
    await refresh();
  };

  const addAdjustment = async (product_id: string, location_id: string, recorded_qty: number, counted_qty: number, reason: string) => {
    const ref = await getNextRef("ADJ");
    const diff = counted_qty - recorded_qty;
    await supabase.from("adjustments").insert({ reference: ref, product_id, location_id, recorded_qty, counted_qty, difference: diff, reason, status: "completed", date: new Date().toISOString().split("T")[0] });
    await supabase.from("stock").upsert({ product_id, location_id, quantity: counted_qty }, { onConflict: "product_id,location_id" });
    const loc = locations.find(l => l.id === location_id);
    await supabase.from("stock_ledger").insert({ type: "adjustment", reference: ref, product_id, location_id, quantity: diff, from_location: loc?.name || "", to_location: loc?.name || "", notes: reason });
    await refresh();
  };

  return {
    categories, warehouses, locations, products, stock, receipts, deliveries, transfers, adjustments, ledger, loading,
    addCategory, deleteCategory,
    addWarehouse, updateWarehouse, deleteWarehouse,
    addLocation, deleteLocation,
    addProduct, updateProduct, deleteProduct,
    addReceipt, validateReceipt,
    addDelivery, advanceDelivery,
    addTransfer, validateTransfer,
    addAdjustment,
    refresh,
  };
}
