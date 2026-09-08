"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile, AppRole } from "@/types/database";

export async function getUsersAction(): Promise<{
  success: boolean;
  data: (Profile & { email?: string; branch_name?: string })[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, branches(name)")
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const formatted = (profiles || []).map((p: any) => ({
      ...p,
      branch_name: p.branches?.name || "Main Branch",
      email: p.id === "00000000-0000-0000-0000-000000000001" ? "manager@stockerp.et" : "staff@stockerp.et",
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function updateUserRoleAction(userId: string, newRole: AppRole) {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/users");
    revalidatePath("/manager");
    revalidatePath("/staff");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
