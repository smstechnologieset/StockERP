import { createClient } from "@/lib/supabase/server";
import { POSRegister } from "./POSRegister";
import type { Product, Unit, ProductCurrentStockView } from "@/types/database";

export const revalidate = 0;

export default async function NewSalePage() {
  let products: Product[] = [];
  let units: Unit[] = [];
  let stockView: ProductCurrentStockView[] = [];

  try {
    const supabase = createClient();

    const [prodRes, unitsRes, stockRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("units").select("*").order("conversion_factor"),
      supabase.from("view_product_current_stock").select("*"),
    ]);

    if (prodRes.data) products = prodRes.data;
    if (unitsRes.data) units = unitsRes.data;
    if (stockRes.data) stockView = stockRes.data;
  } catch (error) {
    console.error("Error fetching POS data:", error);
  }

  // Fallbacks if tables not yet populated
  if (products.length === 0) {
    products = [
      {
        id: "demo-1",
        name: "Berbere Special Grade 1",
        code: "BER-001",
        category: "Powders & Spices",
        description: "",
        default_unit_id: "2",
        reorder_threshold_base_units: 10000,
        cost_price_per_base_unit: 0.65,
        selling_price_per_base_unit: 0.90,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-2",
        name: "Sinde (Wheat Grain)",
        code: "WHT-001",
        category: "Whole Grains",
        description: "",
        default_unit_id: "3",
        reorder_threshold_base_units: 200000,
        cost_price_per_base_unit: 0.048,
        selling_price_per_base_unit: 0.065,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-3",
        name: "Ater (Split Yellow Peas)",
        code: "ATR-001",
        category: "Pulses / Legumes",
        description: "",
        default_unit_id: "2",
        reorder_threshold_base_units: 15000,
        cost_price_per_base_unit: 0.12,
        selling_price_per_base_unit: 0.16,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-4",
        name: "Barley / Gebs",
        code: "BAR-001",
        category: "Whole Grains",
        description: "",
        default_unit_id: "3",
        reorder_threshold_base_units: 150000,
        cost_price_per_base_unit: 0.042,
        selling_price_per_base_unit: 0.058,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
  }

  if (units.length === 0) {
    units = [
      { id: "1", name: "Gram", symbol: "g", conversion_factor: 1, is_base_unit: true, created_at: "" },
      { id: "2", name: "Kilogram", symbol: "kg", conversion_factor: 1000, is_base_unit: false, created_at: "" },
      { id: "3", name: "Quintal (Kuntal)", symbol: "q", conversion_factor: 100000, is_base_unit: false, created_at: "" },
      { id: "4", name: "Milligram", symbol: "mg", conversion_factor: 0.001, is_base_unit: false, created_at: "" },
      { id: "5", name: "250g Packet", symbol: "pkt-250g", conversion_factor: 250, is_base_unit: false, created_at: "" },
      { id: "6", name: "50kg Sack", symbol: "sack-50kg", conversion_factor: 50000, is_base_unit: false, created_at: "" },
    ];
  }

  return (
    <POSRegister
      products={products}
      units={units}
      stockView={stockView}
    />
  );
}
