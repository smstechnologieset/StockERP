import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "./InventoryClient";
import type { ProductCurrentStockView, Unit } from "@/types/database";
import { STANDARD_UNITS, mergeWithStandardUnits } from "@/lib/constants/units";

export const revalidate = 0;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  let inventory: ProductCurrentStockView[] = [];
  let units: Unit[] = [];

  try {
    const supabase = createClient();

    // 1. Fetch inventory stock view
    const { data: stockData } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("product_name", { ascending: true });

    if (stockData && stockData.length > 0) {
      inventory = stockData;
    }

    // 2. Fetch units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .order("conversion_factor", { ascending: true });

    if (unitsData && unitsData.length > 0) {
      units = unitsData;
    } else {
      units = STANDARD_UNITS;
    }
  } catch (error) {
    console.error("Error fetching inventory view:", error);
    units = STANDARD_UNITS;
  }

  return (
    <InventoryClient
      initialInventory={inventory}
      units={mergeWithStandardUnits(units)}
      initialFilter={searchParams.filter}
    />
  );
}
