"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PurchaseItemInput {
  product_id: string;
  unit_id: string;
  quantity: number; // in selected unit
  unit_cost: number; // ETB per selected unit
  conversion_factor: number; // unit multiplier to grams
}

export interface CreatePurchaseInput {
  branch_id?: string;
  supplier_id: string;
  purchase_date: string;
  invoice_reference?: string;
  notes?: string;
  items: PurchaseItemInput[];
}

export async function createPurchaseAction(input: CreatePurchaseInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const branchId = input.branch_id || "00000000-0000-0000-0000-000000000001";
    const recordedBy = user?.id || null;

    // Calculate total cost
    let totalCost = 0;
    const preparedItems = input.items.map((item) => {
      const lineTotal = Number((item.quantity * item.unit_cost).toFixed(2));
      totalCost += lineTotal;

      const quantityBaseUnits = Number((item.quantity * item.conversion_factor).toFixed(3));
      const costPerBaseUnit = quantityBaseUnits > 0 ? Number((lineTotal / quantityBaseUnits).toFixed(4)) : 0;

      return {
        product_id: item.product_id,
        unit_id: item.unit_id,
        quantity: item.quantity,
        quantity_base_units: quantityBaseUnits,
        unit_cost: item.unit_cost,
        total_cost: lineTotal,
        cost_per_base_unit: costPerBaseUnit,
      };
    });

    // 1. Insert header purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        branch_id: branchId,
        supplier_id: input.supplier_id,
        purchase_date: input.purchase_date,
        invoice_reference: input.invoice_reference || null,
        total_cost: totalCost,
        notes: input.notes || null,
        recorded_by: recordedBy,
      })
      .select()
      .single();

    if (purchaseError) {
      throw new Error(`Failed to create purchase: ${purchaseError.message}`);
    }

    // 2. Insert line items
    const lineItemsToInsert = preparedItems.map((item) => ({
      ...item,
      purchase_id: purchase.id,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_items")
      .insert(lineItemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to record purchase items: ${itemsError.message}`);
    }

    // 3. Insert into append-only stock_movements ledger!
    // Positive grams for incoming stock
    const stockMovementsToInsert = preparedItems.map((item) => ({
      branch_id: branchId,
      product_id: item.product_id,
      movement_type: "purchase",
      quantity_base_units: item.quantity_base_units, // Positive
      original_quantity: item.quantity,
      unit_id: item.unit_id,
      reference_id: purchase.id,
      reference_type: "purchase",
      manual_override: false,
      notes: `Stock-in from purchase ref: ${input.invoice_reference || purchase.id.slice(0, 8)}`,
      recorded_by: recordedBy,
    }));

    const { error: ledgerError } = await supabase
      .from("stock_movements")
      .insert(stockMovementsToInsert);

    if (ledgerError) {
      throw new Error(`Failed to record stock ledger movements: ${ledgerError.message}`);
    }

    // 4. Update products' cost_price_per_base_unit for valuation
    for (const item of preparedItems) {
      if (item.cost_per_base_unit > 0) {
        await supabase
          .from("products")
          .update({
            cost_price_per_base_unit: item.cost_per_base_unit,
          })
          .eq("id", item.product_id);
      }
    }

    // Revalidate relevant pages
    revalidatePath("/staff");
    revalidatePath("/manager");
    revalidatePath("/inventory");
    revalidatePath("/purchases");

    return { success: true, purchaseId: purchase.id };
  } catch (error: any) {
    console.error("Purchase creation error:", error);
    return { success: false, error: error.message };
  }
}
