
-- ACID-compliant function for processing inventory movements
-- Uses a single transaction to ensure atomicity
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

-- Add unique constraint on inventory for upsert support (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_product_warehouse_unique'
  ) THEN
    ALTER TABLE inventory ADD CONSTRAINT inventory_product_warehouse_unique UNIQUE (product_id, warehouse_id);
  END IF;
END $$;
