-- ==============================================================================
-- Grain & Powder Trading ERP - Initial Database Schema Migration
-- Phase 1: Core Tables, Relationships, Constraints, and Stock View
-- Base Unit of Measurement: Grams (g)
-- Currency: Ethiopian Birr (ETB)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BRANCHES / LOCATIONS
-- Even though we start with one main location, every inventory-affecting record
-- references branch_id so adding branches in the future requires no schema rewrites.
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.branches IS 'Physical stores/warehouses. Defaults to Main Branch.';

-- Insert default Main Branch if it does not exist
INSERT INTO public.branches (id, name, code, address, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Branch', 'MAIN', 'Addis Ababa, Ethiopia', true)
ON CONFLICT (code) DO NOTHING;

-- 3. USER ROLES ENUM & PROFILES TABLE
-- Roles:
--   'owner_manager': Full access to products, pricing, suppliers, staff, reports, and operations.
--   'staff': Operational access to record purchases, record sales, and view stock levels.
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner_manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role public.app_role NOT NULL DEFAULT 'staff',
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users with ERP roles and branch assignment.';

-- Automatically create profile row when new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'staff'::public.app_role),
        '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. UNITS TABLE (Extensible Unit Conversion Engine)
-- How unit conversion works:
-- The base unit for all storage, ledger calculations, and alerts is GRAMS (g).
-- conversion_factor tells us: "1 of this unit = X grams".
-- Example:
--   1 Gram = 1.0 g (Base unit)
--   1 Kilogram (kg) = 1,000.0 g
--   1 Quintal (q) / Kuntal = 100,000.0 g (100 kg)
--   1 Milligram (mg) = 0.001 g
--   1 "250g Packet" = 250.0 g
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    symbol TEXT NOT NULL UNIQUE,
    conversion_factor NUMERIC(15, 6) NOT NULL CHECK (conversion_factor > 0),
    is_base_unit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.units IS 'Measurement units with conversion factor to the base unit (grams).';
COMMENT ON COLUMN public.units.conversion_factor IS 'Multiplier to convert 1 unit into grams (e.g. 1 kg = 1000 g).';

-- Ensure only one base unit can exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_single_base_unit 
ON public.units (is_base_unit) WHERE (is_base_unit = true);

-- 5. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.suppliers IS 'Vendors and farmers supplying grains, spices, and powdered goods.';

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    category TEXT NOT NULL DEFAULT 'Grains', -- 'Grains', 'Powders & Spices', 'Pulses / Legumes', etc.
    description TEXT,
    default_unit_id UUID REFERENCES public.units(id),
    reorder_threshold_base_units NUMERIC(15, 3) NOT NULL DEFAULT 10000.000, -- in grams (e.g. 10,000 g = 10 kg)
    cost_price_per_base_unit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- ETB per gram
    selling_price_per_base_unit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- ETB per gram
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Inventory catalog (e.g., Berbere, Sinde, Ater, Wheat, Barley). Prices & thresholds in grams.';

-- 7. STOCK MOVEMENTS (Single Source of Truth Ledger)
-- Append-only ledger! Every purchase, sale, or manual inventory adjustment adds a row here.
-- Current stock is ALWAYS the sum of quantity_base_units for a given product.
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment_in', 'adjustment_out')),
    quantity_base_units NUMERIC(15, 3) NOT NULL, -- Positive for stock in, negative for stock out
    original_quantity NUMERIC(15, 3) NOT NULL, -- The quantity the user typed
    unit_id UUID NOT NULL REFERENCES public.units(id), -- The unit the user selected
    reference_id UUID, -- Links to purchases.id, sales.id, or stock_adjustments.id
    reference_type TEXT CHECK (reference_type IN ('purchase', 'sale', 'manual_adjustment')),
    manual_override BOOLEAN NOT NULL DEFAULT false,
    override_reason TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stock_movements IS 'Immutable, append-only inventory ledger. Single source of truth for stock quantities.';

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at);

-- 8. CURRENT STOCK VIEW
-- Real-time aggregation of current inventory in grams and converted default unit
CREATE OR REPLACE VIEW public.view_product_current_stock AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.code AS product_code,
    p.category AS product_category,
    p.default_unit_id,
    u.name AS default_unit_name,
    u.symbol AS default_unit_symbol,
    u.conversion_factor AS default_unit_factor,
    p.reorder_threshold_base_units,
    p.cost_price_per_base_unit,
    p.selling_price_per_base_unit,
    p.is_active,
    b.id AS branch_id,
    b.name AS branch_name,
    COALESCE(SUM(sm.quantity_base_units), 0) AS current_stock_base_units,
    -- Converted stock in product's default unit
    CASE 
        WHEN COALESCE(u.conversion_factor, 0) > 0 THEN 
            ROUND(COALESCE(SUM(sm.quantity_base_units), 0) / u.conversion_factor, 3)
        ELSE 0
    END AS current_stock_default_unit,
    -- Low stock indicator
    CASE 
        WHEN COALESCE(SUM(sm.quantity_base_units), 0) <= p.reorder_threshold_base_units THEN true 
        ELSE false 
    END AS is_low_stock,
    -- Estimated total valuation (ETB) = current grams * cost per gram
    ROUND(COALESCE(SUM(sm.quantity_base_units), 0) * p.cost_price_per_base_unit, 2) AS current_valuation_etb
FROM public.products p
CROSS JOIN public.branches b
LEFT JOIN public.units u ON p.default_unit_id = u.id
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id AND sm.branch_id = b.id
GROUP BY p.id, u.id, b.id;

COMMENT ON VIEW public.view_product_current_stock IS 'Aggregated real-time stock levels, default unit conversion, and low-stock alert status.';

-- 9. PURCHASES & PURCHASE ITEMS (Stock-In)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_reference TEXT,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.purchases IS 'Incoming stock shipments from suppliers.';

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0), -- Cost in ETB per selected unit
    total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
    cost_per_base_unit NUMERIC(15, 4) NOT NULL CHECK (cost_per_base_unit >= 0), -- Cost in ETB per gram
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.purchase_items IS 'Line items for each purchase shipment, converted to base unit grams.';

-- 10. SALES & SALE ITEMS (POS Outgoing Stock)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'telebirr', 'cbe_birr', 'bank_transfer', 'credit')),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sales IS 'Customer point-of-sale invoices.';

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0), -- Price in ETB per selected unit
    total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
    price_per_base_unit NUMERIC(15, 4) NOT NULL CHECK (price_per_base_unit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sale_items IS 'Line items for sales transactions.';

-- 11. STOCK ADJUSTMENTS (Manual Reconciliation)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    reason TEXT NOT NULL, -- E.g. 'Drying moisture loss', 'Spillage', 'Annual inventory count audit'
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stock_adjustments IS 'Manual adjustments for physical inventory discrepancies, spillage, drying loss.';
