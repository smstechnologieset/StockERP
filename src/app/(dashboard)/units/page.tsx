import { createClient } from "@/lib/supabase/server";
import { UnitsClient } from "./UnitsClient";
import type { Unit } from "@/types/database";
import { mergeWithStandardUnits } from "@/lib/constants/units";

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

  return <UnitsClient initialUnits={mergeWithStandardUnits(units)} isManager={isManager} />;
}
