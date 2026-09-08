"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StockAdjustmentInput {
  product_id: string;
  adjustment_type: "in" | "out";
  quantity: number;
  unit_id: string;
  reason: string;
  branch_id?: string;
}

export async function recordStockAdjustmentAction(input: StockAdjustmentInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const branchId = input.branch_id || "00000000-0000-0000-0000-000000000001";
    const recordedBy = user?.id || null;

    if (!input.quantity || input.quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }
    if (!input.reason || input.reason.trim() === "") {
      throw new Error("Reason for stock adjustment is required (e.g., spillage, recount audit).");
    }

    // Fetch unit conversion factor
    const { data: unit, error: unitErr } = await supabase
      .from("units")
      .select("conversion_factor, symbol")
      .eq("id", input.unit_id)
      .single();

    if (unitErr || !unit) {
      throw new Error("Specified unit of measure was not found.");
    }

    const factor = Number(unit.conversion_factor) || 1;
    const quantityGrams = Number((input.quantity * factor).toFixed(3));
    const signedGrams = input.adjustment_type === "in" ? quantityGrams : -quantityGrams;
    const movementType = input.adjustment_type === "in" ? "adjustment_in" : "adjustment_out";

    // Insert into stock_movements ledger
    const { error: ledgerError } = await supabase.from("stock_movements").insert({
      branch_id: branchId,
      product_id: input.product_id,
      movement_type: movementType,
      quantity_base_units: signedGrams,
      original_quantity: input.quantity,
      unit_id: input.unit_id,
      reference_type: "adjustment",
      manual_override: true,
      override_reason: input.reason,
      notes: `Manual adjustment: ${input.reason}`,
      recorded_by: recordedBy,
    });

    if (ledgerError) {
      throw new Error(`Failed to record stock adjustment: ${ledgerError.message}`);
    }

    revalidatePath("/inventory");
    revalidatePath("/inventory/movements");
    revalidatePath("/manager");
    revalidatePath("/staff");

    return { success: true };
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return { success: false, error: error.message };
  }
}
