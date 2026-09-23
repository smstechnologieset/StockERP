"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSupplierStatusAction(supplierId: string, isActive: boolean) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("suppliers")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", supplierId);

    if (error) throw error;

    revalidatePath("/suppliers");
    revalidatePath("/purchases/new");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSupplierAction(supplierId: string) {
  try {
    const supabase = createClient();

    // Check if supplier has historical purchases
    const { count: purchaseCount, error: countErr } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", supplierId);

    if (countErr) {
      console.error("Error checking supplier purchases:", countErr);
    }

    if (purchaseCount && purchaseCount > 0) {
      // Safe fallback: Archive instead of hard delete to preserve audit history
      const { error: archiveErr } = await supabase
        .from("suppliers")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", supplierId);

      if (archiveErr) throw archiveErr;

      revalidatePath("/suppliers");
      revalidatePath("/purchases/new");

      return {
        success: true,
        archived: true,
        message:
          "Supplier has historical purchase shipments. Safely archived instead of deleted to protect procurement history.",
      };
    }

    // Hard delete if no purchases exist
    const { error: deleteErr } = await supabase.from("suppliers").delete().eq("id", supplierId);
    if (deleteErr) throw deleteErr;

    revalidatePath("/suppliers");
    revalidatePath("/purchases/new");

    return { success: true, archived: false, message: "Supplier deleted successfully." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
