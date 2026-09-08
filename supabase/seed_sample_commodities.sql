-- ==============================================================================
-- Grain & Powder Trading ERP - Sample Commodities & Initial Ledger Seed
-- Run this in Supabase SQL Editor to populate authentic Ethiopian trading sample data
-- ==============================================================================

-- 1. SEED SUPPLIERS
INSERT INTO public.suppliers (id, name, contact_person, phone, address, notes, is_active)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'Arsi Bale Farmers Grain Cooperative', 'Ato Tadesse Gemeda', '+251 911 234567', 'Bale Robe, Oromia', 'Primary producer of Sinde (Wheat) and Barley', true),
    ('20000000-0000-0000-0000-000000000002', 'Merkato Spice Wholesalers Union', 'W/ro Almaz Bekele', '+251 922 987654', 'Merkato, Addis Ababa', 'Specialist in sundried red pepper pods and spiced Berbere blends', true),
    ('20000000-0000-0000-0000-000000000003', 'Gojjam Teff & Pulse Farmers', 'Ato Mulugeta Assefa', '+251 933 456789', 'Debre Markos, Amhara', 'High-altitude split yellow peas (Ater) and legumes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED COMMODITY PRODUCTS
-- Gram cost and selling prices:
--   Berbere: 650 ETB/kg -> 0.65 ETB/g | Selling 900 ETB/kg -> 0.90 ETB/g | Reorder 10 kg -> 10,000 g
--   Sinde: 4,800 ETB/q -> 0.048 ETB/g | Selling 6,500 ETB/q -> 0.065 ETB/g | Reorder 2 q -> 200,000 g
--   Ater: 120 ETB/kg -> 0.12 ETB/g | Selling 160 ETB/kg -> 0.16 ETB/g | Reorder 15 kg -> 15,000 g
--   Barley/Gebs: 4,200 ETB/q -> 0.042 ETB/g | Selling 5,800 ETB/q -> 0.058 ETB/g | Reorder 1.5 q -> 150,000 g
INSERT INTO public.products (id, name, code, category, description, default_unit_id, cost_price_per_base_unit, selling_price_per_base_unit, reorder_threshold_base_units, is_active)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Berbere Special Grade 1', 'BER-001', 'Powders & Spices', 'Premium sundried Ethiopian red chili blend seasoned with garlic, ginger, and korarima', '10000000-0000-0000-0000-000000000002', 0.6500, 0.9000, 10000.000, true),
    ('30000000-0000-0000-0000-000000000002', 'Sinde (Wheat Grain)', 'WHT-001', 'Whole Grains', 'High-protein bread wheat grain clean from chaff', '10000000-0000-0000-0000-000000000003', 0.0480, 0.0650, 200000.000, true),
    ('30000000-0000-0000-0000-000000000003', 'Ater (Split Yellow Peas)', 'ATR-001', 'Pulses / Legumes', 'Clean split peas ideal for Shiro preparation and Kik Alicha stew', '10000000-0000-0000-0000-000000000002', 0.1200, 0.1600, 15000.000, true),
    ('30000000-0000-0000-0000-000000000004', 'Barley (Gebs)', 'BAR-001', 'Whole Grains', 'Ethiopian highland roasted and malting barley for Besso and soup', '10000000-0000-0000-0000-000000000003', 0.0420, 0.0580, 150000.000, true)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    cost_price_per_base_unit = EXCLUDED.cost_price_per_base_unit,
    selling_price_per_base_unit = EXCLUDED.selling_price_per_base_unit,
    reorder_threshold_base_units = EXCLUDED.reorder_threshold_base_units;

-- 3. SEED INITIAL STOCK MOVEMENTS (Stock-In Purchases Ledger)
-- Sinde: 10 quintals = 1,000,000 grams
-- Barley: 12 quintals = 1,200,000 grams
-- Berbere: 50 kg = 50,000 grams
-- Ater: 10 kg = 10,000 grams (Triggering low stock warning!)
INSERT INTO public.stock_movements (id, branch_id, product_id, movement_type, quantity_base_units, original_quantity, unit_id, manual_override, notes)
VALUES
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'purchase', 1000000.000, 10.000, '10000000-0000-0000-0000-000000000003', false, 'Initial Arsi shipment: 10 quintals Sinde'),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'purchase', 1200000.000, 12.000, '10000000-0000-0000-0000-000000000003', false, 'Initial Bale shipment: 12 quintals Barley'),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'purchase', 50000.000, 50.000, '10000000-0000-0000-0000-000000000002', false, 'Initial Merkato batch: 50 kg Berbere Special'),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'purchase', 10000.000, 10.000, '10000000-0000-0000-0000-000000000002', false, 'Initial batch: 10 kg Ater (Low Stock baseline)')
ON CONFLICT (id) DO NOTHING;
