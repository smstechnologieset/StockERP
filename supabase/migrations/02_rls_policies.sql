-- ==============================================================================
-- Grain & Powder Trading ERP - Row Level Security (RLS) Policies Migration
-- Phase 1: Security Functions, RLS Enablement, and Role-Based Permissions
-- ==============================================================================

-- 1. HELPER FUNCTIONS
-- Why SECURITY DEFINER?
-- When checking a user's role from public.profiles, if public.profiles has RLS enabled,
-- a standard query might trigger infinite recursion or get blocked.
-- A SECURITY DEFINER function temporarily runs with database owner privileges
-- to safely check the role of auth.uid() without triggering RLS checks.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_role() IS 'Safely returns current authenticated user role (owner_manager or staff).';

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

COMMENT ON FUNCTION public.is_manager() IS 'Returns true if current authenticated user is an owner_manager.';

-- 2. ENABLE RLS ON ALL TABLES
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

-- 3. POLICIES: BRANCHES
-- Everyone logged in can view branches; only managers can create or edit branches.
DROP POLICY IF EXISTS "Allow authenticated users to read branches" ON public.branches;
CREATE POLICY "Allow authenticated users to read branches"
ON public.branches FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow managers to manage branches" ON public.branches;
CREATE POLICY "Allow managers to manage branches"
ON public.branches FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 4. POLICIES: PROFILES
-- Staff can view their own profile; managers can view all staff profiles.
DROP POLICY IF EXISTS "Allow users to view own profile or managers view all" ON public.profiles;
CREATE POLICY "Allow users to view own profile or managers view all"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_manager());

-- Staff can update their own full name; managers can update roles and branches.
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_manager())
WITH CHECK (
    public.is_manager() OR 
    (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 5. POLICIES: UNITS
-- Everyone needs to read units for conversion and forms. Only managers can add or edit units.
DROP POLICY IF EXISTS "Allow authenticated to view units" ON public.units;
CREATE POLICY "Allow authenticated to view units"
ON public.units FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow managers to manage units" ON public.units;
CREATE POLICY "Allow managers to manage units"
ON public.units FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 6. POLICIES: SUPPLIERS
-- All staff can view suppliers (needed to record purchases). Only managers can create/edit suppliers.
DROP POLICY IF EXISTS "Allow authenticated to view suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated to view suppliers"
ON public.suppliers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow managers to manage suppliers" ON public.suppliers;
CREATE POLICY "Allow managers to manage suppliers"
ON public.suppliers FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 7. POLICIES: PRODUCTS
-- Everyone can view active products. Only managers can add, edit pricing, or archive products.
DROP POLICY IF EXISTS "Allow authenticated to view products" ON public.products;
CREATE POLICY "Allow authenticated to view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow managers to manage products" ON public.products;
CREATE POLICY "Allow managers to manage products"
ON public.products FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 8. POLICIES: PURCHASES & PURCHASE ITEMS
-- Both staff and managers can view and record incoming stock. Only managers can update/delete recorded purchases.
DROP POLICY IF EXISTS "Allow authenticated to view purchases" ON public.purchases;
CREATE POLICY "Allow authenticated to view purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to create purchases" ON public.purchases;
CREATE POLICY "Allow authenticated to create purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow managers to update/delete purchases" ON public.purchases;
CREATE POLICY "Allow managers to update/delete purchases"
ON public.purchases FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- Purchase Items
DROP POLICY IF EXISTS "Allow authenticated to view purchase items" ON public.purchase_items;
CREATE POLICY "Allow authenticated to view purchase items"
ON public.purchase_items FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert purchase items" ON public.purchase_items;
CREATE POLICY "Allow authenticated to insert purchase items"
ON public.purchase_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow managers to modify purchase items" ON public.purchase_items;
CREATE POLICY "Allow managers to modify purchase items"
ON public.purchase_items FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 9. POLICIES: SALES & SALE ITEMS
-- Both staff and managers can view and record sales. Only managers can edit or void sales.
DROP POLICY IF EXISTS "Allow authenticated to view sales" ON public.sales;
CREATE POLICY "Allow authenticated to view sales"
ON public.sales FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to create sales" ON public.sales;
CREATE POLICY "Allow authenticated to create sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow managers to modify sales" ON public.sales;
CREATE POLICY "Allow managers to modify sales"
ON public.sales FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- Sale Items
DROP POLICY IF EXISTS "Allow authenticated to view sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated to view sale items"
ON public.sale_items FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert sale items" ON public.sale_items;
CREATE POLICY "Allow authenticated to insert sale items"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow managers to modify sale items" ON public.sale_items;
CREATE POLICY "Allow managers to modify sale items"
ON public.sale_items FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());

-- 10. POLICIES: STOCK MOVEMENTS (Append-Only Ledger)
-- CRITICAL AUDIT RULE:
-- No one (neither staff nor manager) can UPDATE or DELETE from stock_movements!
-- This ensures the ledger is 100% tamper-proof. Corrections are made via new adjustments.
DROP POLICY IF EXISTS "Allow authenticated to view stock movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated to view stock movements"
ON public.stock_movements FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert stock movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated to insert stock movements"
ON public.stock_movements FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Notice: NO UPDATE OR DELETE POLICIES EXIST FOR stock_movements.

-- 11. POLICIES: STOCK ADJUSTMENTS
DROP POLICY IF EXISTS "Allow authenticated to view stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow authenticated to view stock adjustments"
ON public.stock_adjustments FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow authenticated to insert stock adjustments"
ON public.stock_adjustments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow managers to modify stock adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow managers to modify stock adjustments"
ON public.stock_adjustments FOR ALL
TO authenticated
USING (public.is_manager())
WITH CHECK (public.is_manager());
