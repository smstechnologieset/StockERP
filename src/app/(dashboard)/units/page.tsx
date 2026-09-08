import { createClient } from "@/lib/supabase/server";
import { UnitsClient } from "./UnitsClient";
import type { Unit } from "@/types/database";

export const revalidate = 0;

export default async function UnitsPage() {
  let units: Unit[] = [];
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
      .from("units")
      .select("*")
      .order("conversion_factor", { ascending: true });

    if (data && data.length > 0) {
      units = data;
    }
  } catch (error) {
    console.error("Error fetching units:", error);
  }

  // Fallback initial units if database query fails
  const initialUnits: Unit[] = units.length > 0 ? units : [
    { id: "1", name: "Gram", symbol: "g", conversion_factor: 1, is_base_unit: true, created_at: "" },
    { id: "2", name: "Kilogram", symbol: "kg", conversion_factor: 1000, is_base_unit: false, created_at: "" },
    { id: "3", name: "Quintal (Kuntal)", symbol: "q", conversion_factor: 100000, is_base_unit: false, created_at: "" },
    { id: "4", name: "Milligram", symbol: "mg", conversion_factor: 0.001, is_base_unit: false, created_at: "" },
    { id: "5", name: "250g Packet", symbol: "pkt-250g", conversion_factor: 250, is_base_unit: false, created_at: "" },
    { id: "6", name: "50kg Sack", symbol: "sack-50kg", conversion_factor: 50000, is_base_unit: false, created_at: "" },
  ];

  return <UnitsClient initialUnits={initialUnits} isManager={isManager} />;
}
