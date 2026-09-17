import { createClient } from "@/lib/supabase/server";
import { POSRegister } from "./POSRegister";
import type { Product, Unit, ProductCurrentStockView } from "@/types/database";
import { STANDARD_UNITS, mergeWithStandardUnits } from "@/lib/constants/units";

export const revalidate = 0;

export default async function NewSalePage() {
  let products: Product[] = [];
  let units: Unit[] = [];
  let stockView: ProductCurrentStockView[] = [];

  let isManager = false;

  try {
    const supabase = createClient();

    const [prodRes, unitsRes, stockRes, userRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("units").select("*").order("conversion_factor"),
      supabase.from("view_product_current_stock").select("*"),
      supabase.auth.getUser(),
    ]);

    if (prodRes.data) products = prodRes.data;
    if (unitsRes.data) units = unitsRes.data;
    if (stockRes.data) stockView = stockRes.data;

    if (userRes.data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userRes.data.user.id)
        .single();
      isManager = profile?.role === "owner_manager";
    }
  } catch (error) {
    console.error("Error fetching POS data:", error);
  }

  if (units.length === 0) {
    units = STANDARD_UNITS;
  }

  return (
    <POSRegister
      products={products}
      units={mergeWithStandardUnits(units)}
      stockView={stockView}
      isManager={isManager}
    />
  );
}
