import { createClient } from "@/lib/supabase/server";
import { MovementsClient } from "./MovementsClient";
import type { StockMovement } from "@/types/database";

export const revalidate = 0;

export default async function MovementsPage() {
  let movements: StockMovement[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        product:products(name, code, category, default_unit:units(*)),
        unit:units(name, symbol, conversion_factor)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      errorMsg = error.message;
    } else if (data) {
      movements = data as any;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Fallback demo data if empty
  if (movements.length === 0 && !errorMsg) {
    movements = [
      {
        id: "m-1",
        branch_id: "00000000-0000-0000-0000-000000000001",
        product_id: "p-2",
        movement_type: "purchase",
        quantity_base_units: 800000,
        original_quantity: 8,
        unit_id: "3",
        reference_id: "po-101",
        reference_type: "purchase",
        manual_override: false,
        override_reason: null,
        notes: "Supplier delivery from Arsi Grain Union",
        recorded_by: null,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        product: {
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
        },
        unit: {
          id: "3",
          name: "Quintal (Kuntal)",
          symbol: "q",
          conversion_factor: 100000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "m-2",
        branch_id: "00000000-0000-0000-0000-000000000001",
        product_id: "p-2",
        movement_type: "sale",
        quantity_base_units: -200000,
        original_quantity: 2,
        unit_id: "3",
        reference_id: "inv-891023",
        reference_type: "sale",
        manual_override: false,
        override_reason: null,
        notes: "POS Sale invoice: INV-891023",
        recorded_by: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        product: {
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
        },
        unit: {
          id: "3",
          name: "Quintal (Kuntal)",
          symbol: "q",
          conversion_factor: 100000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "m-3",
        branch_id: "00000000-0000-0000-0000-000000000001",
        product_id: "p-1",
        movement_type: "purchase",
        quantity_base_units: 50000,
        original_quantity: 50,
        unit_id: "2",
        reference_id: "po-102",
        reference_type: "purchase",
        manual_override: false,
        override_reason: null,
        notes: "Received fresh Berbere Batch #4",
        recorded_by: null,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        product: {
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
        },
        unit: {
          id: "2",
          name: "Kilogram",
          symbol: "kg",
          conversion_factor: 1000,
          is_base_unit: false,
          created_at: "",
        },
      },
      {
        id: "m-4",
        branch_id: "00000000-0000-0000-0000-000000000001",
        product_id: "p-1",
        movement_type: "adjustment_out",
        quantity_base_units: -500,
        original_quantity: 0.5,
        unit_id: "2",
        reference_id: null,
        reference_type: "adjustment",
        manual_override: true,
        override_reason: "Bag puncture spillage in storage room",
        notes: "Manual adjustment: Spillage during handling",
        recorded_by: null,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        product: {
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
        },
        unit: {
          id: "2",
          name: "Kilogram",
          symbol: "kg",
          conversion_factor: 1000,
          is_base_unit: false,
          created_at: "",
        },
      },
    ];
  }

  return <MovementsClient initialMovements={movements} error={errorMsg} />;
}
