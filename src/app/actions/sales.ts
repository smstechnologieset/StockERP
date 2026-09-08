"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaleItemInput {
  product_id: string;
  unit_id: string;
  quantity: number;
  unit_price: number;
  conversion_factor: number;
}

export interface CreateSaleInput {
  branch_id?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method: "cash" | "telebirr" | "cbe_birr" | "bank_transfer" | "credit";
  notes?: string;
  manual_override?: boolean;
  override_reason?: string;
  items: SaleItemInput[];
}

export async function createSaleAction(input: CreateSaleInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const branchId = input.branch_id || "00000000-0000-0000-0000-000000000001";
    const recordedBy = user?.id || null;

    if (!input.items || input.items.length === 0) {
      throw new Error("No items in sale.");
    }

    // 1. Stock verification per product
    for (const item of input.items) {
      const requiredGrams = Number((item.quantity * item.conversion_factor).toFixed(3));

      // Query current stock in grams from movements
      const { data: movements } = await supabase
        .from("stock_movements")
        .select("quantity_base_units")
        .eq("product_id", item.product_id)
        .eq("branch_id", branchId);

      const currentGrams = (movements || []).reduce(
        (sum, m) => sum + (Number(m.quantity_base_units) || 0),
        0
      );

      const projectedGrams = currentGrams - requiredGrams;

      if (projectedGrams < 0) {
        if (!input.manual_override || !input.override_reason || input.override_reason.trim() === "") {
          const { data: prod } = await supabase
            .from("products")
            .select("name")
            .eq("id", item.product_id)
            .single();

          const prodName = prod?.name || "Product";
          throw new Error(
            `Insufficient stock for "${prodName}". Current on-hand: ${currentGrams.toLocaleString()} g. Requested: ${requiredGrams.toLocaleString()} g. Projected: ${projectedGrams.toLocaleString()} g. An explicit manual override and reason are required to proceed.`
          );
        }
      }
    }

    // 2. Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    // 3. Calculate total amount and line items
    let totalAmount = 0;
    const preparedItems = input.items.map((item) => {
      const lineTotal = Number((item.quantity * item.unit_price).toFixed(2));
      totalAmount += lineTotal;

      const quantityBaseUnits = Number((item.quantity * item.conversion_factor).toFixed(3));
      const pricePerBaseUnit = quantityBaseUnits > 0 ? Number((lineTotal / quantityBaseUnits).toFixed(4)) : 0;

      return {
        product_id: item.product_id,
        unit_id: item.unit_id,
        quantity: item.quantity,
        quantity_base_units: quantityBaseUnits,
        unit_price: item.unit_price,
        total_price: lineTotal,
        price_per_base_unit: pricePerBaseUnit,
      };
    });

    // 4. Insert header sale invoice
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        branch_id: branchId,
        invoice_number: invoiceNumber,
        customer_name: input.customer_name || "Walk-in Customer",
        customer_phone: input.customer_phone || null,
        payment_method: input.payment_method,
        total_amount: totalAmount,
        notes: input.notes || null,
        recorded_by: recordedBy,
      })
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    // 5. Insert sale items
    const saleItemsToInsert = preparedItems.map((item) => ({
      ...item,
      sale_id: sale.id,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to record sale items: ${itemsError.message}`);
    }

    // 6. Insert into append-only stock_movements ledger!
    // NEGATIVE grams for outgoing sale stock
    const stockMovementsToInsert = preparedItems.map((item) => ({
      branch_id: branchId,
      product_id: item.product_id,
      movement_type: "sale",
      quantity_base_units: -item.quantity_base_units, // NEGATIVE
      original_quantity: item.quantity,
      unit_id: item.unit_id,
      reference_id: sale.id,
      reference_type: "sale",
      manual_override: input.manual_override || false,
      override_reason: input.override_reason || null,
      notes: `POS Sale invoice: ${invoiceNumber}`,
      recorded_by: recordedBy,
    }));

    const { error: ledgerError } = await supabase
      .from("stock_movements")
      .insert(stockMovementsToInsert);

    if (ledgerError) {
      throw new Error(`Failed to record stock ledger movements: ${ledgerError.message}`);
    }

    revalidatePath("/staff");
    revalidatePath("/manager");
    revalidatePath("/inventory");
    revalidatePath("/sales");

    return {
      success: true,
      saleId: sale.id,
      invoiceNumber: invoiceNumber,
      totalAmount: totalAmount,
    };
  } catch (error: any) {
    console.error("Sale creation error:", error);
    return { success: false, error: error.message };
  }
}
