import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./PricingClient";
import type { Product, Unit } from "@/types/database";

export const revalidate = 0;

export default async function PricingManagementPage() {
  let products: (Product & { default_unit?: Unit })[] = [];

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, default_unit:units(*)")
      .order("name", { ascending: true });

    if (data) {
      products = data as any;
    }
  } catch (err) {
    console.error("Pricing page fetch error:", err);
  }

  // Fallback demo if database empty
  if (products.length === 0) {
    products = [
      {
        id: "p-1",
        name: "Berbere Special Grade 1",
        code: "BER-001",
        category: "Powders & Spices",
        description: null,
        default_unit_id: "2",
        reorder_threshold_base_units: 10000,
        cost_price_per_base_unit: 0.65,
        selling_price_per_base_unit: 0.90,
        is_active: true,
        created_at: "",
        updated_at: "",
        default_unit: {
          id: "2",
          name: "Kilogram",
          symbol: "kg",
          conversion_factor: 1000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "p-2",
        name: "Sinde (Wheat Grain)",
        code: "WHT-001",
        category: "Whole Grains",
        description: null,
        default_unit_id: "3",
        reorder_threshold_base_units: 200000,
        cost_price_per_base_unit: 0.048,
        selling_price_per_base_unit: 0.065,
        is_active: true,
        created_at: "",
        updated_at: "",
        default_unit: {
          id: "3",
          name: "Quintal (Kuntal)",
          symbol: "q",
          conversion_factor: 100000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "p-3",
        name: "Ater (Split Yellow Peas)",
        code: "ATR-001",
        category: "Pulses / Legumes",
        description: null,
        default_unit_id: "2",
        reorder_threshold_base_units: 15000,
        cost_price_per_base_unit: 0.12,
        selling_price_per_base_unit: 0.16,
        is_active: true,
        created_at: "",
        updated_at: "",
        default_unit: {
          id: "2",
          name: "Kilogram",
          symbol: "kg",
          conversion_factor: 1000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "p-4",
        name: "Gebs / Barley",
        code: "BAR-001",
        category: "Whole Grains",
        description: null,
        default_unit_id: "3",
        reorder_threshold_base_units: 150000,
        cost_price_per_base_unit: 0.042,
        selling_price_per_base_unit: 0.058,
        is_active: true,
        created_at: "",
        updated_at: "",
        default_unit: {
          id: "3",
          name: "Quintal (Kuntal)",
          symbol: "q",
          conversion_factor: 100000,
          is_base_unit: false,
          created_at: "",
        },
      },
    ];
  }

  return <PricingClient initialProducts={products} />;
}
