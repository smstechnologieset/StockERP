-- ==============================================================================
-- Grain & Powder Trading ERP - Seed Data
-- Standard Ethiopian trading units and initial Main Branch
-- ==============================================================================

-- 1. SEED MAIN BRANCH
INSERT INTO public.branches (id, name, code, address, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Main Branch', 'MAIN', 'Addis Ababa, Ethiopia', true)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED DEFAULT UNITS
-- All conversion factors represent: 1 of this unit = X grams
INSERT INTO public.units (id, name, symbol, conversion_factor, is_base_unit)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Gram', 'g', 1.000000, true),
    ('10000000-0000-0000-0000-000000000002', 'Kilogram', 'kg', 1000.000000, false),
    ('10000000-0000-0000-0000-000000000003', 'Quintal (Kuntal)', 'q', 100000.000000, false),
    ('10000000-0000-0000-0000-000000000004', 'Milligram', 'mg', 0.001000, false),
    ('10000000-0000-0000-0000-000000000005', '250g Packet', 'pkt-250g', 250.000000, false),
    ('10000000-0000-0000-0000-000000000006', '50kg Sack', 'sack-50kg', 50000.000000, false)
ON CONFLICT (symbol) DO UPDATE 
SET 
    name = EXCLUDED.name,
    conversion_factor = EXCLUDED.conversion_factor,
    is_base_unit = EXCLUDED.is_base_unit;
