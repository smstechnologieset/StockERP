-- ==============================================================================
-- Grain & Powder Trading ERP - Stock Ledger Logic & Negative Stock Protection
-- Phase 1: Database Functions for Inventory Validation & Ledger Integrity
-- ==============================================================================

-- 1. FUNCTION: get_product_stock_grams
-- Returns current stock in grams for a product at a branch
CREATE OR REPLACE FUNCTION public.get_product_stock_grams(
    p_product_id UUID,
    p_branch_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
)
RETURNS NUMERIC(15, 3)
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(quantity_base_units), 0)::NUMERIC(15, 3)
    FROM public.stock_movements
    WHERE product_id = p_product_id AND branch_id = p_branch_id;
$$;

COMMENT ON FUNCTION public.get_product_stock_grams IS 'Calculates current on-hand stock in grams for a specific product and branch.';

-- 2. TRIGGER FUNCTION: check_negative_stock_before_movement
-- Enforces: "Do not let a sale push stock negative without an explicit manual override + reason."
-- When an outgoing movement (negative quantity) is inserted, it checks if current stock + quantity < 0.
-- If so, it fails UNLESS manual_override = true AND override_reason is provided.
CREATE OR REPLACE FUNCTION public.enforce_negative_stock_protection()
RETURNS trigger AS $$
DECLARE
    v_current_stock NUMERIC(15, 3);
    v_projected_stock NUMERIC(15, 3);
    v_product_name TEXT;
BEGIN
    -- Only outgoing movements (negative base quantity) can reduce stock
    IF NEW.quantity_base_units < 0 THEN
        -- Get current stock
        SELECT COALESCE(SUM(quantity_base_units), 0)
        INTO v_current_stock
        FROM public.stock_movements
        WHERE product_id = NEW.product_id AND branch_id = NEW.branch_id;

        v_projected_stock := v_current_stock + NEW.quantity_base_units;

        -- If projected stock goes below zero
        IF v_projected_stock < 0 THEN
            -- Check if explicit override and reason are present
            IF NEW.manual_override IS NOT TRUE OR NEW.override_reason IS NULL OR TRIM(NEW.override_reason) = '' THEN
                SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;
                RAISE EXCEPTION 'Insufficient stock for "%". Current stock: % g, Requested reduction: % g. Projected stock: % g. An explicit manual override and reason are required to allow negative stock.',
                    COALESCE(v_product_name, 'Product'),
                    v_current_stock,
                    ABS(NEW.quantity_base_units),
                    v_projected_stock;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_negative_stock ON public.stock_movements;
CREATE TRIGGER trg_check_negative_stock
    BEFORE INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_negative_stock_protection();

COMMENT ON TRIGGER trg_check_negative_stock ON public.stock_movements IS 'Blocks outgoing movements that drop stock below zero unless explicitly overridden with a reason.';
