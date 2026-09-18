"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PriceUpdateItem {
  id: string;
  cost_price_per_base_unit: number;
  selling_price_per_base_unit: number;
}

export async function updateProductPricesAction(updates: PriceUpdateItem[]) {
  try {
    const supabase = createClient();

    for (const item of updates) {
      const { error } = await supabase
        .from("products")
        .update({
          cost_price_per_base_unit: item.cost_price_per_base_unit,
          selling_price_per_base_unit: item.selling_price_per_base_unit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        throw new Error(`Failed to update price for product ${item.id}: ${error.message}`);
      }
    }

    revalidatePath("/products");
    revalidatePath("/products/pricing");
    revalidatePath("/inventory");
    revalidatePath("/sales/new");
    revalidatePath("/manager");

    return { success: true };
  } catch (err: any) {
    console.error("Price update error:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleProductStatusAction(productId: string, isActive: boolean) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/sales/new");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const supabase = createClient();

    // First check if product has movements or sales
    const { count: movementCount } = await supabase
      .from("stock_movements")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (movementCount && movementCount > 0) {
      // Safe fallback: Archive instead of hard delete
      await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", productId);

      revalidatePath("/products");
      revalidatePath("/inventory");

      return {
        success: true,
        archived: true,
        message:
          "Product has historical inventory movements. It has been safely archived instead of deleted to protect audit history.",
      };
    }

    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) throw error;

    revalidatePath("/products");
    revalidatePath("/inventory");

    return { success: true, archived: false, message: "Product deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface SaveProductInput {
  id?: string;
  name: string;
  code?: string | null;
  category: string;
  description?: string | null;
  default_unit_id: string;
  cost_price_per_base_unit: number;
  selling_price_per_base_unit: number;
  reorder_threshold_base_units: number;
  is_active?: boolean;
  initial_stock?: number;
  target_stock?: number;
  current_stock?: number;
  adjustment_reason?: string;
  branch_id?: string;
}

export async function saveProductWithStockAction(input: SaveProductInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch user branch or fallback to default single branch
    let branchId = input.branch_id;
    if (!branchId && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("branch_id")
        .eq("id", user.id)
        .single();
      branchId = profile?.branch_id;
    }
    if (!branchId) {
      branchId = "00000000-0000-0000-0000-000000000001";
    }

    const cleanCode = input.code && input.code.trim() !== "" ? input.code.trim() : null;

    if (!input.id) {
      // 1. Create new product
      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert({
          name: input.name.trim(),
          code: cleanCode,
          category: input.category,
          description: input.description?.trim() || null,
          default_unit_id: input.default_unit_id,
          cost_price_per_base_unit: input.cost_price_per_base_unit,
          selling_price_per_base_unit: input.selling_price_per_base_unit,
          reorder_threshold_base_units: input.reorder_threshold_base_units,
          is_active: input.is_active ?? true,
        })
        .select("*, default_unit:units(*)")
        .single();

      if (insertError) throw insertError;

      // 2. Initial stock if specified and > 0
      const initialStockQty = Number(input.initial_stock) || 0;
      if (initialStockQty > 0) {
        const factor = Number(newProduct.default_unit?.conversion_factor) || 1;
        const quantityBaseUnits = Number((initialStockQty * factor).toFixed(3));

        const { error: stockErr } = await supabase.from("stock_movements").insert({
          branch_id: branchId,
          product_id: newProduct.id,
          movement_type: "adjustment_in",
          quantity_base_units: quantityBaseUnits,
          original_quantity: initialStockQty,
          unit_id: input.default_unit_id,
          reference_type: "manual_adjustment",
          manual_override: true,
          override_reason: input.adjustment_reason?.trim() || "Initial stock on product registration",
          notes: `Opening balance entered during product registration (${initialStockQty} ${newProduct.default_unit?.symbol || "units"})`,
          recorded_by: user?.id || null,
        });

        if (stockErr) {
          console.error("Warning: could not record initial stock movement:", stockErr);
        }
      }

      revalidatePath("/products");
      revalidatePath("/products/pricing");
      revalidatePath("/inventory");
      revalidatePath("/inventory/movements");
      revalidatePath("/sales/new");
      revalidatePath("/purchases/new");
      revalidatePath("/manager");
      revalidatePath("/staff");
      revalidatePath("/reports");

      const factor = Number(newProduct.default_unit?.conversion_factor) || 1;
      const baseUnits = initialStockQty * factor;

      return {
        success: true,
        product: {
          ...newProduct,
          current_stock_default_unit: initialStockQty,
          current_stock_base_units: baseUnits,
          is_low_stock: baseUnits <= Number(newProduct.reorder_threshold_base_units),
        },
      };
    } else {
      // 1. Update existing product details
      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({
          name: input.name.trim(),
          code: cleanCode,
          category: input.category,
          description: input.description?.trim() || null,
          default_unit_id: input.default_unit_id,
          cost_price_per_base_unit: input.cost_price_per_base_unit,
          selling_price_per_base_unit: input.selling_price_per_base_unit,
          reorder_threshold_base_units: input.reorder_threshold_base_units,
          is_active: input.is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("*, default_unit:units(*)")
        .single();

      if (updateError) throw updateError;

      // 2. Check if stock was adjusted
      let finalStock = input.current_stock !== undefined ? Number(input.current_stock) : 0;
      if (
        input.target_stock !== undefined &&
        input.current_stock !== undefined &&
        !isNaN(input.target_stock) &&
        !isNaN(input.current_stock)
      ) {
        const targetQty = Number(input.target_stock);
        const currentQty = Number(input.current_stock);
        const delta = Number((targetQty - currentQty).toFixed(3));

        if (Math.abs(delta) > 0.0001) {
          const factor = Number(updatedProduct.default_unit?.conversion_factor) || 1;
          const deltaBaseUnits = Number((Math.abs(delta) * factor).toFixed(3));
          const isIncrease = delta > 0;

          const { error: stockErr } = await supabase.from("stock_movements").insert({
            branch_id: branchId,
            product_id: input.id,
            movement_type: isIncrease ? "adjustment_in" : "adjustment_out",
            quantity_base_units: isIncrease ? deltaBaseUnits : -deltaBaseUnits,
            original_quantity: Math.abs(delta),
            unit_id: input.default_unit_id,
            reference_type: "manual_adjustment",
            manual_override: true,
            override_reason: input.adjustment_reason?.trim() || "Stock adjustment in product editor",
            notes: `Stock count changed from ${currentQty} to ${targetQty} (${isIncrease ? "+" : ""}${delta} ${updatedProduct.default_unit?.symbol || "units"})`,
            recorded_by: user?.id || null,
          });

          if (stockErr) {
            console.error("Stock adjustment error:", stockErr);
            throw new Error(`Failed to update stock: ${stockErr.message}`);
          }

          finalStock = targetQty;
        }
      }

      revalidatePath("/products");
      revalidatePath("/products/pricing");
      revalidatePath("/inventory");
      revalidatePath("/inventory/movements");
      revalidatePath("/sales/new");
      revalidatePath("/purchases/new");
      revalidatePath("/manager");
      revalidatePath("/staff");
      revalidatePath("/reports");

      const factor = Number(updatedProduct.default_unit?.conversion_factor) || 1;
      const baseUnits = finalStock * factor;

      return {
        success: true,
        product: {
          ...updatedProduct,
          current_stock_default_unit: finalStock,
          current_stock_base_units: baseUnits,
          is_low_stock: baseUnits <= Number(updatedProduct.reorder_threshold_base_units),
        },
      };
    }
  } catch (err: any) {
    console.error("Save product error:", err);
    return { success: false, error: err.message || "Failed to save product" };
  }
}
