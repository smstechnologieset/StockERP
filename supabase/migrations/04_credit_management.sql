-- ==============================================================================
-- Grain & Powder Trading ERP - Credit Management Migration (Phase 6)
-- Track customer credit sales, partial down payments, installments, and due dates
-- ==============================================================================

-- 1. CUSTOMER CREDITS (Accounts Receivable)
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

COMMENT ON TABLE public.customer_credits IS 'Tracks customers buying grain/powder on partial or 100% credit.';

CREATE INDEX IF NOT EXISTS idx_customer_credits_status ON public.customer_credits(status);
CREATE INDEX IF NOT EXISTS idx_customer_credits_customer ON public.customer_credits(customer_name);

-- 2. CREDIT PAYMENTS (Installment History)
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

COMMENT ON TABLE public.credit_payments IS 'Installment repayments made by customers toward their outstanding credit.';

CREATE INDEX IF NOT EXISTS idx_credit_payments_credit ON public.credit_payments(credit_id);

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view customer credits" ON public.customer_credits;
CREATE POLICY "Allow authenticated to view customer credits"
ON public.customer_credits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert customer credits" ON public.customer_credits;
CREATE POLICY "Allow authenticated to insert customer credits"
ON public.customer_credits FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to update customer credits" ON public.customer_credits;
CREATE POLICY "Allow authenticated to update customer credits"
ON public.customer_credits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Credit Payments Policies
DROP POLICY IF EXISTS "Allow authenticated to view credit payments" ON public.credit_payments;
CREATE POLICY "Allow authenticated to view credit payments"
ON public.credit_payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert credit payments" ON public.credit_payments;
CREATE POLICY "Allow authenticated to insert credit payments"
ON public.credit_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
