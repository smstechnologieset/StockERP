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
