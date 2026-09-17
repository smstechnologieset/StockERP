import { createClient } from "@/lib/supabase/server";
import { SuppliersClient } from "./SuppliersClient";
import type { Supplier } from "@/types/database";

export const revalidate = 0;

export default async function SuppliersPage() {
  let suppliers: Supplier[] = [];
  let isManager = true;

  try {
    const supabase = createClient();

    // Check user role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      isManager = profile?.role === "owner_manager";
    }

    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      suppliers = data;
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error);
  }

  return (
    <SuppliersClient
      initialSuppliers={suppliers}
      isManager={isManager}
    />
  );
}
