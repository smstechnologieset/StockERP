import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "./InventoryClient";
import type { ProductCurrentStockView, Unit } from "@/types/database";
import { STANDARD_UNITS } from "@/lib/constants/units";

export const revalidate = 0;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  let inventory: ProductCurrentStockView[] = [];
  let units: Unit[] = [];

  try {
    const supabase = createClient();

    // 1. Fetch inventory stock view
    const { data: stockData } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("product_name", { ascending: true });

    if (stockData && stockData.length > 0) {
      inventory = stockData;
    }

    // 2. Fetch units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .order("conversion_factor", { ascending: true });

    if (unitsData && unitsData.length > 0) {
      units = unitsData;
    } else {
      units = STANDARD_UNITS;
    }
  } catch (error) {
    console.error("Error fetching inventory view:", error);
    units = STANDARD_UNITS;
  }

  // Fallback demo data if empty
  const displayInventory: ProductCurrentStockView[] = inventory.length > 0 ? inventory : [
    {
      product_id: "p-1",
      product_name: "Berbere Special Grade 1",
      product_code: "BER-001",
      product_category: "Powders & Spices",
      default_unit_id: "2",
      default_unit_name: "Kilogram",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      reorder_threshold_base_units: 10000,
      cost_price_per_base_unit: 0.65,
      selling_price_per_base_unit: 0.90,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 45000,
      current_stock_default_unit: 45,
      is_low_stock: false,
      current_valuation_etb: 29250.0,
    },
    {
      product_id: "p-2",
      product_name: "Sinde (Wheat Grain)",
      product_code: "WHT-001",
      product_category: "Whole Grains",
      default_unit_id: "3",
      default_unit_name: "Quintal (Kuntal)",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      reorder_threshold_base_units: 200000,
      cost_price_per_base_unit: 0.048,
      selling_price_per_base_unit: 0.065,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 800000,
      current_stock_default_unit: 8,
      is_low_stock: false,
      current_valuation_etb: 38400.0,
    },
    {
      product_id: "p-3",
      product_name: "Ater (Split Yellow Peas)",
      product_code: "ATR-001",
      product_category: "Pulses / Legumes",
      default_unit_id: "2",
      default_unit_name: "Kilogram",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      reorder_threshold_base_units: 15000,
      cost_price_per_base_unit: 0.12,
      selling_price_per_base_unit: 0.16,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 8500,
      current_stock_default_unit: 8.5,
      is_low_stock: true,
      current_valuation_etb: 1020.0,
    },
    {
      product_id: "p-4",
      product_name: "Barley / Gebs",
      product_code: "BAR-001",
      product_category: "Whole Grains",
      default_unit_id: "3",
      default_unit_name: "Quintal (Kuntal)",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      reorder_threshold_base_units: 150000,
      cost_price_per_base_unit: 0.042,
      selling_price_per_base_unit: 0.058,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 1200000,
      current_stock_default_unit: 12,
      is_low_stock: false,
      current_valuation_etb: 50400.0,
    },
  ];

  const defaultUnits: Unit[] = units.length > 0 ? units : [
    { id: "1", name: "Gram", symbol: "g", conversion_factor: 1, is_base_unit: true, created_at: "" },
    { id: "2", name: "Kilogram", symbol: "kg", conversion_factor: 1000, is_base_unit: false, created_at: "" },
    { id: "3", name: "Quintal (Kuntal)", symbol: "q", conversion_factor: 100000, is_base_unit: false, created_at: "" },
  ];

  return (
    <InventoryClient
      initialInventory={displayInventory}
      units={defaultUnits}
      initialFilter={searchParams.filter}
    />
  );
}
