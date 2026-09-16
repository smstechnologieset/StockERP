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
  update_catalog_cost?: boolean;
  transport_cost?: number;
  labor_cost?: number;
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

    // Calculate commodity items subtotal
    let itemsSubtotal = 0;
    const preparedItems = input.items.map((item) => {
      const lineTotal = Number((item.quantity * item.unit_cost).toFixed(2));
      itemsSubtotal += lineTotal;

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

    const transportCost = Number(input.transport_cost) || 0;
    const laborCost = Number(input.labor_cost) || 0;
    const grandTotalCost = Number((itemsSubtotal + transportCost + laborCost).toFixed(2));

    // Append logistics breakdown to notes for full ledger traceability
    let notesText = input.notes || null;
    if (transportCost > 0 || laborCost > 0) {
      const breakdownParts: string[] = [];
      if (transportCost > 0) breakdownParts.push(`ትራንስፖርት/Transport: ${transportCost.toLocaleString()} ETB`);
      if (laborCost > 0) breakdownParts.push(`የማውረጃ ጉልበት/Labor: ${laborCost.toLocaleString()} ETB`);
      const breakdownStr = `[${breakdownParts.join(" | ")}]`;
      notesText = notesText ? `${notesText} ${breakdownStr}` : breakdownStr;
    }

    // 1. Insert header purchase record
    let purchase: any;
    const { data: pData, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        branch_id: branchId,
        supplier_id: input.supplier_id,
        purchase_date: input.purchase_date,
        invoice_reference: input.invoice_reference || null,
        transport_cost: transportCost,
        labor_cost: laborCost,
        total_cost: grandTotalCost,
        notes: notesText,
        recorded_by: recordedBy,
      })
      .select()
      .single();

    if (purchaseError) {
      // Graceful fallback if database schema migration hasn't been applied yet in remote DB
      if (purchaseError.message.includes("transport_cost") || purchaseError.message.includes("labor_cost")) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("purchases")
          .insert({
            branch_id: branchId,
            supplier_id: input.supplier_id,
            purchase_date: input.purchase_date,
            invoice_reference: input.invoice_reference || null,
            total_cost: grandTotalCost,
            notes: notesText,
            recorded_by: recordedBy,
          })
          .select()
          .single();

        if (fallbackError) {
          throw new Error(`Failed to create purchase: ${fallbackError.message}`);
        }
        purchase = fallbackData;
      } else {
        throw new Error(`Failed to create purchase: ${purchaseError.message}`);
      }
    } else {
      purchase = pData;
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

    // 4. Update products' cost_price_per_base_unit ONLY if explicitly requested by manager
    if (input.update_catalog_cost) {
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
