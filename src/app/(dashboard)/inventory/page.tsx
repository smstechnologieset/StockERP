import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "./InventoryClient";
import type { ProductCurrentStockView, Unit } from "@/types/database";
import { STANDARD_UNITS, mergeWithStandardUnits } from "@/lib/constants/units";

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
      current_stock_base_units: 154000,
      current_stock_default_unit: 154,
      is_low_stock: false,
      current_valuation_etb: 100100,
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
      current_stock_base_units: 180000,
      current_stock_default_unit: 1.8,
      is_low_stock: true,
      current_valuation_etb: 8640,
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
      current_stock_base_units: 42000,
      current_stock_default_unit: 42,
      is_low_stock: false,
      current_valuation_etb: 5040,
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
      current_stock_base_units: 120000,
      current_stock_default_unit: 1.2,
      is_low_stock: true,
      current_valuation_etb: 5040,
    },
  ];

  return (
    <InventoryClient
      initialInventory={displayInventory}
      units={mergeWithStandardUnits(units)}
      initialFilter={searchParams.filter}
    />
  );
}
