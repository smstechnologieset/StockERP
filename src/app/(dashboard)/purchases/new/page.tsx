import { createClient } from "@/lib/supabase/server";
import { ReceiveStockForm } from "./ReceiveStockForm";
import type { Product, Unit, Supplier } from "@/types/database";
import { STANDARD_UNITS, mergeWithStandardUnits } from "@/lib/constants/units";

export const revalidate = 0;

export default async function NewPurchasePage() {
  let products: Product[] = [];
  let units: Unit[] = [];
  let suppliers: Supplier[] = [];

  try {
    const supabase = createClient();

    const [prodRes, unitsRes, supRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("units").select("*").order("conversion_factor"),
      supabase.from("suppliers").select("*").eq("is_active", true).order("name"),
    ]);

    if (prodRes.data) products = prodRes.data;
    if (unitsRes.data) units = unitsRes.data;
    if (supRes.data) suppliers = supRes.data;
  } catch (error) {
    console.error("Error fetching purchase form data:", error);
  }

  if (units.length === 0) {
    units = STANDARD_UNITS;
  }

  return (
    <ReceiveStockForm
      products={products}
      units={mergeWithStandardUnits(units)}
      suppliers={suppliers}
    />
  );
}
