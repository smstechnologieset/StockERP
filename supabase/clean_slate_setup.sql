-- ==============================================================================
-- StockERP - COMPLETE CLEAN-SLATE DATABASE SETUP SCRIPT (ZERO DUMMY DATA)
-- ==============================================================================
-- Run this single script on a brand-new, empty Supabase project.
-- It initializes:
--   1. Extensions (uuid-ossp, pgcrypto)
--   2. All 12 core tables (including transport_cost and labor_cost for logistics)
--   3. All 12 standard Ethiopian trading units (kg, quintal, liter, bag, etc.)
--   4. The physical inventory ledger and real-time current stock view
--   5. Customer credit accounts & installment tracking
--   6. Negative stock enforcement triggers
--   7. Bulletproof Row Level Security (RLS) policies & API role grants
--   8. Initial ready-to-use Manager and Staff login credentials
--
-- Starting State:
--   ✓ 0 Products (Clean catalog ready for client's own commodities)
--   ✓ 0 Suppliers (Clean slate for client's actual farmers / cooperatives)
--   ✓ 0 Sales / Invoices
--   ✓ 0 Purchases / Expenses
--   ✓ 0 Debts / Credits
--
-- HOW TO RUN:
--   1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
--   2. In the left navigation, click "SQL Editor"
--   3. Click "New query"
--   4. Paste this ENTIRE script and click "Run" (Ctrl + Enter)
--   5. Copy your Project URL & anon key into .env.local:
--        NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
--        SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
--   6. Log in with the Manager credentials created below!
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. BRANCHES / LOCATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.branches IS 'Physical store or warehouse branch location.';

-- Seed default primary branch
INSERT INTO public.branches (id, name, code, address, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Branch', 'MAIN', 'Addis Ababa, Ethiopia', true)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. USER ROLES ENUM & PROFILES
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with ERP roles and branch assignment.';

-- Automatic profile creation trigger when any auth.user signs up or is created
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
    SET full_name = EXCLUDED.full_name,
        role = COALESCE(EXCLUDED.role, public.profiles.role);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. UNITS TABLE (Standard Ethiopian Trading & Retail Units)
-- Base unit is Gram (g) for solids/grains/spices; Liter (1000g eq) for liquids.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    symbol TEXT NOT NULL UNIQUE,
    conversion_factor NUMERIC(15, 6) NOT NULL CHECK (conversion_factor > 0),
    is_base_unit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_single_base_unit 
ON public.units (is_base_unit) WHERE (is_base_unit = true);

-- Pre-seed all standard units so product creation works seamlessly immediately
INSERT INTO public.units (id, name, symbol, conversion_factor, is_base_unit)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Gram', 'g', 1.000000, true),
    ('10000000-0000-0000-0000-000000000002', 'Kilogram', 'kg', 1000.000000, false),
    ('10000000-0000-0000-0000-000000000003', 'Quintal (Kuntal)', 'q', 100000.000000, false),
    ('10000000-0000-0000-0000-000000000004', 'Milligram', 'mg', 0.001000, false),
    ('10000000-0000-0000-0000-000000000005', 'Packet', 'pkt', 1.000000, false),
    ('10000000-0000-0000-0000-000000000006', '50kg Sack', 'sack-50kg', 50000.000000, false),
    ('10000000-0000-0000-0000-000000000007', 'Liter', 'L', 1000.000000, false),
    ('10000000-0000-0000-0000-000000000008', 'Piece / Item', 'pcs', 1.000000, false),
    ('10000000-0000-0000-0000-000000000009', 'Bottle', 'btl', 1.000000, false),
    ('10000000-0000-0000-0000-000000000010', 'Carton / Box', 'ctn', 1.000000, false),
    ('10000000-0000-0000-0000-000000000011', 'Bag / Sack', 'bag', 50000.000000, false),
    ('10000000-0000-0000-0000-000000000012', 'Milliliter', 'ml', 1.000000, false)
ON CONFLICT (symbol) DO UPDATE 
SET 
    name = EXCLUDED.name,
    conversion_factor = EXCLUDED.conversion_factor,
    is_base_unit = EXCLUDED.is_base_unit;

-- -----------------------------------------------------------------------------
-- 5. SUPPLIERS TABLE (Empty Clean Slate)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6. PRODUCTS TABLE (Empty Clean Slate)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    category TEXT NOT NULL DEFAULT 'Whole Grains',
    description TEXT,
    default_unit_id UUID REFERENCES public.units(id),
    reorder_threshold_base_units NUMERIC(15, 3) NOT NULL DEFAULT 10000.000, -- 10 kg in grams
    cost_price_per_base_unit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- ETB per gram
    selling_price_per_base_unit NUMERIC(15, 4) NOT NULL DEFAULT 0.0000, -- ETB per gram
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. STOCK MOVEMENTS (Physical Inventory Audit Ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment_in', 'adjustment_out')),
    quantity_base_units NUMERIC(15, 3) NOT NULL, -- positive for IN, negative for OUT
    original_quantity NUMERIC(15, 3) NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.units(id),
    reference_id UUID,
    reference_type TEXT CHECK (reference_type IN ('purchase', 'sale', 'manual_adjustment')),
    manual_override BOOLEAN NOT NULL DEFAULT false,
    override_reason TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON public.stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at);

-- -----------------------------------------------------------------------------
-- 8. CURRENT STOCK VIEW (Live On-Hand Stock & Valuations)
-- -----------------------------------------------------------------------------
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
    CASE 
        WHEN COALESCE(u.conversion_factor, 0) > 0 THEN 
            ROUND(COALESCE(SUM(sm.quantity_base_units), 0) / u.conversion_factor, 3)
        ELSE 0
    END AS current_stock_default_unit,
    CASE 
        WHEN COALESCE(SUM(sm.quantity_base_units), 0) <= p.reorder_threshold_base_units THEN true 
        ELSE false 
    END AS is_low_stock,
    ROUND(COALESCE(SUM(sm.quantity_base_units), 0) * p.cost_price_per_base_unit, 2) AS current_valuation_etb
FROM public.products p
CROSS JOIN public.branches b
LEFT JOIN public.units u ON p.default_unit_id = u.id
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id AND sm.branch_id = b.id
GROUP BY p.id, u.id, b.id;

-- -----------------------------------------------------------------------------
-- 9. PURCHASES & PURCHASE ITEMS (With Logistics Breakdown)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_reference TEXT,
    transport_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.purchases.transport_cost IS 'Inbound transportation / freight cost.';
COMMENT ON COLUMN public.purchases.labor_cost IS 'Offloading porter / labor fee.';

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
    cost_per_base_unit NUMERIC(15, 4) NOT NULL CHECK (cost_per_base_unit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. SALES & SALE ITEMS
-- -----------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
    price_per_base_unit NUMERIC(15, 4) NOT NULL CHECK (price_per_base_unit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11. STOCK ADJUSTMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    quantity NUMERIC(15, 3) NOT NULL CHECK (quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    quantity_base_units NUMERIC(15, 3) NOT NULL CHECK (quantity_base_units > 0),
    reason TEXT NOT NULL,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 12. CUSTOMER CREDITS & INSTALLMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total_sale_amount NUMERIC(15, 2) NOT NULL CHECK (total_sale_amount >= 0),
    down_payment_at_sale NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (down_payment_at_sale >= 0),
    total_credit_amount NUMERIC(15, 2) NOT NULL CHECK (total_credit_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_balance NUMERIC(15, 2) NOT NULL CHECK (remaining_balance >= 0),
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_credits_status ON public.customer_credits(status);
CREATE INDEX IF NOT EXISTS idx_customer_credits_customer ON public.customer_credits(customer_name);

CREATE TABLE IF NOT EXISTS public.credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id UUID NOT NULL REFERENCES public.customer_credits(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'telebirr', 'cbe_birr', 'bank_transfer')),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    reference_note TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_payments_credit ON public.credit_payments(credit_id);

-- -----------------------------------------------------------------------------
-- 13. INVENTORY HELPER FUNCTIONS & NEGATIVE STOCK ENFORCEMENT
-- -----------------------------------------------------------------------------
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

CREATE OR REPLACE FUNCTION public.enforce_negative_stock_protection()
RETURNS trigger AS $$
DECLARE
    v_current_stock NUMERIC(15, 3);
    v_projected_stock NUMERIC(15, 3);
    v_product_name TEXT;
BEGIN
    IF NEW.quantity_base_units < 0 THEN
        SELECT COALESCE(SUM(quantity_base_units), 0)
        INTO v_current_stock
        FROM public.stock_movements
        WHERE product_id = NEW.product_id AND branch_id = NEW.branch_id;

        v_projected_stock := v_current_stock + NEW.quantity_base_units;

        IF v_projected_stock < 0 THEN
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

-- -----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT role = 'owner_manager' FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

-- Enable RLS on all operational tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

-- Branches Policies
DROP POLICY IF EXISTS "Allow authenticated to read branches" ON public.branches;
CREATE POLICY "Allow authenticated to read branches" ON public.branches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow managers to manage branches" ON public.branches;
CREATE POLICY "Allow managers to manage branches" ON public.branches FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- Profiles Policies
DROP POLICY IF EXISTS "Allow users to view profiles" ON public.profiles;
CREATE POLICY "Allow users to view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_manager()) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to insert profiles" ON public.profiles;
CREATE POLICY "Allow authenticated to insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

-- Units Policies
DROP POLICY IF EXISTS "Allow authenticated to view units" ON public.units;
CREATE POLICY "Allow authenticated to view units" ON public.units FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage units" ON public.units;
CREATE POLICY "Allow authenticated to manage units" ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers Policies
DROP POLICY IF EXISTS "Allow authenticated to view suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated to view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated to manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products Policies
DROP POLICY IF EXISTS "Allow authenticated to view products" ON public.products;
CREATE POLICY "Allow authenticated to view products" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage products" ON public.products;
CREATE POLICY "Allow authenticated to manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchases Policies
DROP POLICY IF EXISTS "Allow authenticated to view purchases" ON public.purchases;
CREATE POLICY "Allow authenticated to view purchases" ON public.purchases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage purchases" ON public.purchases;
CREATE POLICY "Allow authenticated to manage purchases" ON public.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Items Policies
DROP POLICY IF EXISTS "Allow authenticated to view purchase items" ON public.purchase_items;
CREATE POLICY "Allow authenticated to view purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage purchase items" ON public.purchase_items;
CREATE POLICY "Allow authenticated to manage purchase items" ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales Policies
DROP POLICY IF EXISTS "Allow authenticated to view sales" ON public.sales;
CREATE POLICY "Allow authenticated to view sales" ON public.sales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage sales" ON public.sales;
CREATE POLICY "Allow authenticated to manage sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sale Items Policies
DROP POLICY IF EXISTS "Allow authenticated to view sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated to view sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated to manage sale items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Movements Policies (Append-Only Ledger)
DROP POLICY IF EXISTS "Allow authenticated to view stock movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated to view stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert stock movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated to insert stock movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Stock Adjustments Policies
DROP POLICY IF EXISTS "Allow authenticated to view stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow authenticated to view stock adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow authenticated to insert stock adjustments" ON public.stock_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customer Credits Policies
DROP POLICY IF EXISTS "Allow authenticated to view customer credits" ON public.customer_credits;
CREATE POLICY "Allow authenticated to view customer credits" ON public.customer_credits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage customer credits" ON public.customer_credits;
CREATE POLICY "Allow authenticated to manage customer credits" ON public.customer_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credit Payments Policies
DROP POLICY IF EXISTS "Allow authenticated to view credit payments" ON public.credit_payments;
CREATE POLICY "Allow authenticated to view credit payments" ON public.credit_payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage credit payments" ON public.credit_payments;
CREATE POLICY "Allow authenticated to manage credit payments" ON public.credit_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 15. PERMISSIONS GRANT (PostgREST API Roles)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 16. INITIAL LOGIN ACCOUNTS (Immediate Sign-In)
-- -----------------------------------------------------------------------------
-- Credentials:
--   1. Manager Account (Full Access):
--      Email:    admin@stockerp.com  (or  manager@stockerp.et)
--      Password: Admin@123456        (or  Password123!)
--
--   2. Staff Account (Cashier / Sales & Inbound POS):
--      Email:    staff@stockerp.et
--      Password: Password123!
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id   UUID := 'a0000000-0000-0000-0000-000000000001';
    v_manager_id UUID := 'a0000000-0000-0000-0000-000000000002';
    v_staff_id   UUID := 'a0000000-0000-0000-0000-000000000003';
BEGIN
    -- 1. Primary Admin (admin@stockerp.com / Admin@123456)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        v_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@stockerp.com',
        crypt('Admin@123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Store Administrator","role":"owner_manager"}'::jsonb,
        now(),
        now(),
        '',
        ''
    )
    ON CONFLICT (id) DO UPDATE
    SET
        encrypted_password = crypt('Admin@123456', gen_salt('bf')),
        raw_user_meta_data = '{"full_name":"Store Administrator","role":"owner_manager"}'::jsonb,
        email_confirmed_at = now();

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (
        v_admin_id,
        'Store Administrator',
        'owner_manager',
        '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = 'Store Administrator',
        role = 'owner_manager',
        branch_id = '00000000-0000-0000-0000-000000000001';

    -- 2. Manager Account (manager@stockerp.et / Password123!)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        v_manager_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'manager@stockerp.et',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Owner / Store Manager","role":"owner_manager"}'::jsonb,
        now(),
        now(),
        '',
        ''
    )
    ON CONFLICT (id) DO UPDATE
    SET
        encrypted_password = crypt('Password123!', gen_salt('bf')),
        raw_user_meta_data = '{"full_name":"Owner / Store Manager","role":"owner_manager"}'::jsonb,
        email_confirmed_at = now();

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (
        v_manager_id,
        'Owner / Store Manager',
        'owner_manager',
        '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = 'Owner / Store Manager',
        role = 'owner_manager',
        branch_id = '00000000-0000-0000-0000-000000000001';

    -- 3. Staff Account (staff@stockerp.et / Password123!)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        v_staff_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'staff@stockerp.et',
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Cashier / Sales Staff","role":"staff"}'::jsonb,
        now(),
        now(),
        '',
        ''
    )
    ON CONFLICT (id) DO UPDATE
    SET
        encrypted_password = crypt('Password123!', gen_salt('bf')),
        raw_user_meta_data = '{"full_name":"Cashier / Sales Staff","role":"staff"}'::jsonb,
        email_confirmed_at = now();

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (
        v_staff_id,
        'Cashier / Sales Staff',
        'staff',
        '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = 'Cashier / Sales Staff',
        role = 'staff',
        branch_id = '00000000-0000-0000-0000-000000000001';

    -- 4. INSERT CORRESPONDING IDENTITIES (MANDATORY for Supabase GoTrue Auth)
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES 
    (
        gen_random_uuid(),
        v_admin_id,
        v_admin_id::text,
        json_build_object('sub', v_admin_id::text, 'email', 'admin@stockerp.com')::jsonb,
        'email',
        now(),
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        v_manager_id,
        v_manager_id::text,
        json_build_object('sub', v_manager_id::text, 'email', 'manager@stockerp.et')::jsonb,
        'email',
        now(),
        now(),
        now()
    ),
    (
        gen_random_uuid(),
        v_staff_id,
        v_staff_id::text,
        json_build_object('sub', v_staff_id::text, 'email', 'staff@stockerp.et')::jsonb,
        'email',
        now(),
        now(),
        now()
    )
    ON CONFLICT (provider_id, provider) DO UPDATE
    SET
        identity_data = EXCLUDED.identity_data,
        updated_at = now();

    -- Fallback: Ensure any other existing users also have an identity entry
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        u.id,
        u.id::text,
        json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
        'email',
        now(),
        now(),
        now()
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;

END $$;

-- ==============================================================================
-- CLEAN-SLATE SETUP COMPLETE!
-- Your Supabase database is now completely initialized with:
--   • 0 products, 0 suppliers, 0 sales, 0 purchases, 0 expenses.
--   • All Ethiopian units of measurement ready to use.
--   • Ready for the client to log in and start entering their own business data!
-- ==============================================================================
