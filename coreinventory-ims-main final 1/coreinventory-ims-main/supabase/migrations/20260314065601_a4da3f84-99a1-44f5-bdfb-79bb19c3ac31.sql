
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Product Categories
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert categories" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update categories" ON public.product_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete categories" ON public.product_categories FOR DELETE TO authenticated USING (true);

-- Warehouses
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage locations" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock (per product per location)
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, location_id)
);
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage stock" ON public.stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receipts
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  supplier TEXT NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage receipts" ON public.receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Receipt Lines
CREATE TABLE public.receipt_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  quantity INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.receipt_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage receipt_lines" ON public.receipt_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Deliveries (with 3-step: draft → picking → packing → completed)
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  customer TEXT NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage deliveries" ON public.deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Delivery Lines
CREATE TABLE public.delivery_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  quantity INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.delivery_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage delivery_lines" ON public.delivery_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transfers
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT NOT NULL DEFAULT 'draft',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage transfers" ON public.transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Transfer Lines
CREATE TABLE public.transfer_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.transfer_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage transfer_lines" ON public.transfer_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Adjustments
CREATE TABLE public.adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  recorded_qty INTEGER NOT NULL DEFAULT 0,
  counted_qty INTEGER NOT NULL DEFAULT 0,
  difference INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage adjustments" ON public.adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Ledger (movement log)
CREATE TABLE public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  reference TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  location_id UUID REFERENCES public.locations(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  from_location TEXT DEFAULT '',
  to_location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage stock_ledger" ON public.stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sequence tracking for references
CREATE TABLE public.ref_sequences (
  prefix TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 1000
);
ALTER TABLE public.ref_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage ref_sequences" ON public.ref_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.ref_sequences (prefix, last_number) VALUES
  ('RC', 1005), ('DO', 2003), ('TR', 3002), ('ADJ', 4001);
