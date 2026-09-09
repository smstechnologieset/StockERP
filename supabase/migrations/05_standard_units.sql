-- ==============================================================================
-- Grain, Liquid & General Retail Trading ERP - Standard Units Setup
-- Standard units for single-shop operations (Grains, Liquids/Oils, Packaged goods)
-- ==============================================================================

INSERT INTO public.units (id, name, symbol, conversion_factor, is_base_unit)
VALUES
    ('10000000-0000-0000-0000-000000000002', 'Kilogram', 'kg', 1.000000, true),
    ('10000000-0000-0000-0000-000000000007', 'Liter', 'L', 1.000000, false),
    ('10000000-0000-0000-0000-000000000008', 'Piece / Item', 'pcs', 1.000000, false),
    ('10000000-0000-0000-0000-000000000003', 'Quintal', 'q', 1.000000, false),
    ('10000000-0000-0000-0000-000000000009', 'Bottle', 'btl', 1.000000, false),
    ('10000000-0000-0000-0000-000000000010', 'Carton / Box', 'ctn', 1.000000, false),
    ('10000000-0000-0000-0000-000000000011', 'Bag / Sack', 'bag', 1.000000, false),
    ('10000000-0000-0000-0000-000000000001', 'Gram', 'g', 1.000000, false),
    ('10000000-0000-0000-0000-000000000012', 'Milliliter', 'ml', 1.000000, false),
    ('10000000-0000-0000-0000-000000000005', 'Packet', 'pkt', 1.000000, false)
ON CONFLICT (symbol) DO UPDATE 
SET 
    name = EXCLUDED.name,
    conversion_factor = EXCLUDED.conversion_factor;
