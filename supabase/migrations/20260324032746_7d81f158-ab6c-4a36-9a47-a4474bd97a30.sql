
-- ============================================================
-- 1. Low-stock alert function: returns products below min_stock_level
-- Uses aggregate query with JOIN across inventory, products, warehouses
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
-- 2. Inventory valuation: total value per warehouse
-- Demonstrates aggregate functions, GROUP BY, and JOIN
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
-- 3. Warehouse detail: all products in a given warehouse
-- Parameterized query with filtering
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
-- 4. Movement history with aggregation: daily movement summary
-- Demonstrates date_trunc, GROUP BY, CASE expressions
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_movement_summary(p_days integer DEFAULT 30)
RETURNS TABLE (
  movement_date date,
  incoming_count bigint,
  outgoing_count bigint,
  transfer_count bigint,
  incoming_qty bigint,
  outgoing_qty bigint,
  transfer_qty bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    DATE(created_at) AS movement_date,
    COUNT(*) FILTER (WHERE movement_type = 'incoming') AS incoming_count,
    COUNT(*) FILTER (WHERE movement_type = 'outgoing') AS outgoing_count,
    COUNT(*) FILTER (WHERE movement_type = 'transfer') AS transfer_count,
    COALESCE(SUM(quantity) FILTER (WHERE movement_type = 'incoming'), 0) AS incoming_qty,
    COALESCE(SUM(quantity) FILTER (WHERE movement_type = 'outgoing'), 0) AS outgoing_qty,
    COALESCE(SUM(quantity) FILTER (WHERE movement_type = 'transfer'), 0) AS transfer_qty
  FROM inventory_movements
  WHERE created_at >= (now() - (p_days || ' days')::interval)
  GROUP BY DATE(created_at)
  ORDER BY movement_date DESC;
$$;

-- ============================================================
-- 5. Product search with full-text search capability
-- Demonstrates tsvector, ts_rank for PostgreSQL full-text search
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_products(p_query text)
RETURNS TABLE (
  id uuid,
  name text,
  sku text,
  description text,
  category_name text,
  unit_price numeric,
  total_stock bigint,
  rank real
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
    c.name AS category_name,
    p.unit_price,
    COALESCE(SUM(i.quantity), 0) AS total_stock,
    ts_rank(
      to_tsvector('english', p.name || ' ' || p.sku || ' ' || COALESCE(p.description, '')),
      plainto_tsquery('english', p_query)
    ) AS rank
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN inventory i ON i.product_id = p.id
  WHERE
    to_tsvector('english', p.name || ' ' || p.sku || ' ' || COALESCE(p.description, ''))
    @@ plainto_tsquery('english', p_query)
    OR p.name ILIKE '%' || p_query || '%'
    OR p.sku ILIKE '%' || p_query || '%'
  GROUP BY p.id, p.name, p.sku, p.description, c.name, p.unit_price
  ORDER BY rank DESC, p.name;
$$;

-- ============================================================
-- 6. Dashboard statistics in a single query
-- Demonstrates CTE (Common Table Expressions) and subqueries
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_products bigint,
  total_warehouses bigint,
  total_stock bigint,
  total_value numeric,
  low_stock_count bigint,
  total_movements bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH product_stats AS (
    SELECT COUNT(*) AS cnt FROM products
  ),
  warehouse_stats AS (
    SELECT COUNT(*) AS cnt FROM warehouses
  ),
  inventory_stats AS (
    SELECT
      COALESCE(SUM(i.quantity), 0) AS total_stock,
      COALESCE(SUM(i.quantity * p.unit_price), 0) AS total_value
    FROM inventory i
    JOIN products p ON p.id = i.product_id
  ),
  low_stock AS (
    SELECT COUNT(*) AS cnt
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.quantity <= p.min_stock_level
  ),
  movement_stats AS (
    SELECT COUNT(*) AS cnt FROM inventory_movements
  )
  SELECT
    (SELECT cnt FROM product_stats),
    (SELECT cnt FROM warehouse_stats),
    (SELECT total_stock FROM inventory_stats),
    (SELECT total_value FROM inventory_stats),
    (SELECT cnt FROM low_stock),
    (SELECT cnt FROM movement_stats);
$$;
