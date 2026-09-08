import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding sample suppliers, products, and stock movements...");

  // 1. Suppliers
  const suppliers = [
    {
      id: "20000000-0000-0000-0000-000000000001",
      name: "Arsi Bale Farmers Grain Cooperative",
      contact_person: "Ato Tadesse Gemeda",
      phone: "+251 911 234567",
      address: "Bale Robe, Oromia",
      notes: "Primary producer of Sinde (Wheat) and Barley",
      is_active: true,
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      name: "Merkato Spice Wholesalers Union",
      contact_person: "W/ro Almaz Bekele",
      phone: "+251 922 987654",
      address: "Merkato, Addis Ababa",
      notes: "Specialist in sundried red pepper pods and spiced Berbere blends",
      is_active: true,
    },
    {
      id: "20000000-0000-0000-0000-000000000003",
      name: "Gojjam Teff & Pulse Farmers",
      contact_person: "Ato Mulugeta Assefa",
      phone: "+251 933 456789",
      address: "Debre Markos, Amhara",
      notes: "High-altitude split yellow peas (Ater) and legumes",
      is_active: true,
    },
  ];

  for (const s of suppliers) {
    const { error } = await supabase.from("suppliers").upsert(s);
    if (error) console.error("Supplier upsert error:", error.message);
  }
  console.log("✓ Suppliers seeded");

  // 2. Units lookup (to get kg and quintal IDs)
  const { data: units } = await supabase.from("units").select("*");
  const kgUnit = units?.find((u) => u.symbol === "kg");
  const qUnit = units?.find((u) => u.symbol === "q");

  // 3. Products
  const products = [
    {
      id: "30000000-0000-0000-0000-000000000001",
      name: "Berbere Special Grade 1",
      code: "BER-001",
      category: "Powders & Spices",
      description: "Premium sundried Ethiopian red chili blend seasoned with garlic, ginger, and korarima",
      default_unit_id: kgUnit?.id,
      cost_price_per_base_unit: 0.65,
      selling_price_per_base_unit: 0.90,
      reorder_threshold_base_units: 10000,
      is_active: true,
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      name: "Sinde (Wheat Grain)",
      code: "WHT-001",
      category: "Whole Grains",
      description: "High-protein bread wheat grain clean from chaff",
      default_unit_id: qUnit?.id,
      cost_price_per_base_unit: 0.048,
      selling_price_per_base_unit: 0.065,
      reorder_threshold_base_units: 200000,
      is_active: true,
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      name: "Ater (Split Yellow Peas)",
      code: "ATR-001",
      category: "Pulses / Legumes",
      description: "Clean split peas ideal for Shiro preparation and Kik Alicha stew",
      default_unit_id: kgUnit?.id,
      cost_price_per_base_unit: 0.12,
      selling_price_per_base_unit: 0.16,
      reorder_threshold_base_units: 15000,
      is_active: true,
    },
    {
      id: "30000000-0000-0000-0000-000000000004",
      name: "Barley (Gebs)",
      code: "BAR-001",
      category: "Whole Grains",
      description: "Ethiopian highland roasted and malting barley for Besso and soup",
      default_unit_id: qUnit?.id,
      cost_price_per_base_unit: 0.042,
      selling_price_per_base_unit: 0.058,
      reorder_threshold_base_units: 150000,
      is_active: true,
    },
  ];

  for (const p of products) {
    const { error } = await supabase.from("products").upsert(p);
    if (error) console.error("Product upsert error:", error.message);
  }
  console.log("✓ Commodity products seeded");

  // 4. Initial Stock Movements
  const movements = [
    {
      id: "40000000-0000-0000-0000-000000000001",
      branch_id: "00000000-0000-0000-0000-000000000001",
      product_id: "30000000-0000-0000-0000-000000000002",
      movement_type: "purchase",
      quantity_base_units: 1000000, // 10 quintals
      original_quantity: 10,
      unit_id: qUnit?.id,
      manual_override: false,
      notes: "Initial Arsi shipment: 10 quintals Sinde",
    },
    {
      id: "40000000-0000-0000-0000-000000000002",
      branch_id: "00000000-0000-0000-0000-000000000001",
      product_id: "30000000-0000-0000-0000-000000000004",
      movement_type: "purchase",
      quantity_base_units: 1200000, // 12 quintals
      original_quantity: 12,
      unit_id: qUnit?.id,
      manual_override: false,
      notes: "Initial Bale shipment: 12 quintals Barley",
    },
    {
      id: "40000000-0000-0000-0000-000000000003",
      branch_id: "00000000-0000-0000-0000-000000000001",
      product_id: "30000000-0000-0000-0000-000000000001",
      movement_type: "purchase",
      quantity_base_units: 50000, // 50 kg
      original_quantity: 50,
      unit_id: kgUnit?.id,
      manual_override: false,
      notes: "Initial Merkato batch: 50 kg Berbere Special",
    },
    {
      id: "40000000-0000-0000-0000-000000000004",
      branch_id: "00000000-0000-0000-0000-000000000001",
      product_id: "30000000-0000-0000-0000-000000000003",
      movement_type: "purchase",
      quantity_base_units: 10000, // 10 kg (Below 15 kg threshold => triggers low-stock warning!)
      original_quantity: 10,
      unit_id: kgUnit?.id,
      manual_override: false,
      notes: "Initial batch: 10 kg Ater (Low Stock baseline)",
    },
  ];

  for (const m of movements) {
    const { error } = await supabase.from("stock_movements").upsert(m);
    if (error) console.error("Movement upsert error:", error.message);
  }
  console.log("✓ Initial stock ledger movements seeded");
  console.log("All sample data successfully populated!");
}

seed();
