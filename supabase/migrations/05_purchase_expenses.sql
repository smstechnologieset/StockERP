-- ==============================================================================
-- Grain & Powder Trading ERP - Purchase Logistics & Offloading Expenses Migration
-- Track optional transportation (freight) and offloading labor (porter/ኩሊ) costs
-- ==============================================================================

ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN public.purchases.transport_cost IS 'Optional truck freight or transit fee paid for delivering this shipment.';
COMMENT ON COLUMN public.purchases.labor_cost IS 'Optional porter or day laborer fee paid for offloading bags into the warehouse.';
