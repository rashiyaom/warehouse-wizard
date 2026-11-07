-- ============================================================
-- WAREHOUSE WIZARD - COMPLETE DATABASE SETUP
-- Single comprehensive query - Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  capacity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('incoming', 'outgoing', 'transfer', 'adjustment')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CREATE INDEXES
-- ============================================================

CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory(warehouse_id);
CREATE INDEX idx_movements_product ON public.inventory_movements(product_id);
CREATE INDEX idx_movements_date ON public.inventory_movements(created_at);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category_id);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE RLS POLICIES
-- ============================================================

CREATE POLICY "Allow full access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. CREATE TIMESTAMP TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 6. CREATE TRIGGERS
-- ============================================================

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. PROCESS INVENTORY MOVEMENT - ACID Transaction Handler
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_inventory_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_from_warehouse_id uuid DEFAULT NULL,
  p_to_warehouse_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_movement_id uuid;
  v_current_qty integer;
BEGIN
  -- Validate inputs
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  IF p_movement_type NOT IN ('incoming', 'outgoing', 'transfer', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
  END IF;

  IF p_movement_type = 'incoming' AND p_to_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Incoming movements require a destination warehouse';
  END IF;

  IF p_movement_type = 'outgoing' AND p_from_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'Outgoing movements require a source warehouse';
  END IF;

  IF p_movement_type = 'transfer' AND (p_from_warehouse_id IS NULL OR p_to_warehouse_id IS NULL) THEN
    RAISE EXCEPTION 'Transfers require both source and destination warehouses';
  END IF;

  -- For outgoing and transfer: validate sufficient stock with row-level lock
  IF p_movement_type IN ('outgoing', 'transfer') THEN
    SELECT quantity INTO v_current_qty
    FROM inventory
    WHERE product_id = p_product_id AND warehouse_id = p_from_warehouse_id
    FOR UPDATE;

    IF v_current_qty IS NULL THEN
      RAISE EXCEPTION 'No inventory record found for this product in the source warehouse';
    END IF;

    IF v_current_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock: available %, requested %', v_current_qty, p_quantity;
    END IF;

    -- Decrease source inventory
    UPDATE inventory
    SET quantity = quantity - p_quantity, updated_at = now()
    WHERE product_id = p_product_id AND warehouse_id = p_from_warehouse_id;
  END IF;

  -- For incoming and transfer: increase destination inventory
  IF p_movement_type IN ('incoming', 'transfer') THEN
    INSERT INTO inventory (product_id, warehouse_id, quantity)
    VALUES (p_product_id, p_to_warehouse_id, p_quantity)
    ON CONFLICT (product_id, warehouse_id)
    DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();
  END IF;

  -- Record the movement
  INSERT INTO inventory_movements (product_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, notes)
  VALUES (p_product_id, p_movement_type, p_quantity, p_from_warehouse_id, p_to_warehouse_id, p_notes)
  RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$;

-- ============================================================
-- 8. GET DASHBOARD STATS - KPI Summary
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_warehouses integer,
  total_products integer,
  total_inventory_value numeric,
  low_stock_items integer,
  total_movements bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM warehouses)::integer AS total_warehouses,
    (SELECT COUNT(*) FROM products)::integer AS total_products,
    COALESCE(SUM(i.quantity * p.unit_price), 0) AS total_inventory_value,
    (SELECT COUNT(*) FROM inventory WHERE quantity <= (SELECT min_stock_level FROM products WHERE products.id = inventory.product_id))::integer AS low_stock_items,
    (SELECT COUNT(*) FROM inventory_movements)::bigint AS total_movements
  FROM inventory i
  LEFT JOIN products p ON p.id = i.product_id;
$$;

-- ============================================================
-- 9. GET LOW STOCK ITEMS - Alert System
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_low_stock_items()
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  category_name text,
  category_color text,
  warehouse_id uuid,
  warehouse_name text,
  current_quantity integer,
  min_stock_level integer,
  deficit integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    c.name AS category_name,
    c.color AS category_color,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    i.quantity AS current_quantity,
    p.min_stock_level,
    (p.min_stock_level - i.quantity) AS deficit
  FROM inventory i
  JOIN products p ON p.id = i.product_id
  JOIN warehouses w ON w.id = i.warehouse_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE i.quantity <= p.min_stock_level
  ORDER BY deficit DESC, p.name;
$$;

-- ============================================================
-- 10. GET INVENTORY VALUATION - Financial Reporting
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_inventory_valuation()
RETURNS TABLE (
  warehouse_id uuid,
  warehouse_name text,
  warehouse_location text,
  total_items bigint,
  total_quantity bigint,
  total_value numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    w.location AS warehouse_location,
    COUNT(DISTINCT i.product_id) AS total_items,
    COALESCE(SUM(i.quantity), 0) AS total_quantity,
    COALESCE(SUM(i.quantity * p.unit_price), 0) AS total_value
  FROM warehouses w
  LEFT JOIN inventory i ON i.warehouse_id = w.id
  LEFT JOIN products p ON p.id = i.product_id
  GROUP BY w.id, w.name, w.location
  ORDER BY total_value DESC;
$$;

-- ============================================================
-- 11. GET WAREHOUSE INVENTORY - Detailed Inventory View
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_warehouse_inventory(p_warehouse_id uuid)
RETURNS TABLE (
  inventory_id uuid,
  product_id uuid,
  product_name text,
  sku text,
  category_name text,
  category_color text,
  quantity integer,
  min_stock_level integer,
  unit_price numeric,
  stock_value numeric,
  is_low_stock boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id AS inventory_id,
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    c.name AS category_name,
    c.color AS category_color,
    i.quantity,
    p.min_stock_level,
    p.unit_price,
    (i.quantity * p.unit_price) AS stock_value,
    (i.quantity <= p.min_stock_level) AS is_low_stock
  FROM inventory i
  JOIN products p ON p.id = i.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE i.warehouse_id = p_warehouse_id
  ORDER BY p.name;
$$;

-- ============================================================
-- 12. GET MOVEMENT SUMMARY - Activity Trends
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_movement_summary(p_days integer DEFAULT 30)
RETURNS TABLE (
  movement_type text,
  total_quantity bigint,
  movement_count bigint,
  avg_quantity numeric,
  last_movement_date timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    im.movement_type,
    COALESCE(SUM(im.quantity), 0) AS total_quantity,
    COUNT(*) AS movement_count,
    COALESCE(AVG(im.quantity), 0) AS avg_quantity,
    MAX(im.created_at) AS last_movement_date
  FROM inventory_movements im
  WHERE im.created_at >= (now() - (p_days::text || ' days')::interval)
  GROUP BY im.movement_type
  ORDER BY movement_count DESC;
$$;

-- ============================================================
-- 13. SEARCH PRODUCTS - Full-Text Search
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_products(p_query text)
RETURNS TABLE (
  id uuid,
  name text,
  sku text,
  description text,
  category_id uuid,
  category_name text,
  unit_price numeric,
  min_stock_level integer,
  match_score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.sku,
    p.description,
    p.category_id,
    c.name AS category_name,
    p.unit_price,
    p.min_stock_level,
    CASE
      WHEN p.sku ILIKE p_query || '%' THEN 100
      WHEN p.name ILIKE '%' || p_query || '%' THEN 80
      WHEN p.description ILIKE '%' || p_query || '%' THEN 50
      ELSE 10
    END AS match_score
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.name ILIKE '%' || p_query || '%'
    OR p.sku ILIKE '%' || p_query || '%'
    OR p.description ILIKE '%' || p_query || '%'
  ORDER BY match_score DESC, p.name;
$$;

-- ============================================================
-- ✅ COMPLETE! ALL TABLES, FUNCTIONS, INDEXES & TRIGGERS CREATED
-- ============================================================
-- Summary:
-- ✅ 5 Tables: categories, warehouses, products, inventory, inventory_movements
-- ✅ 6 Indexes: product, warehouse, movement lookups
-- ✅ 3 Triggers: auto-update timestamps
-- ✅ 6 Functions: process_movement, dashboard_stats, low_stock, valuation, warehouse_detail, movement_summary, search
-- ✅ RLS Enabled: All tables with permissive policies
-- Ready to use with React app at http://localhost:8080! 🚀
-- ==========================================================
