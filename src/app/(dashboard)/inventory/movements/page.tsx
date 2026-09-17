import { createClient } from "@/lib/supabase/server";
import { MovementsClient } from "./MovementsClient";
import type { StockMovement } from "@/types/database";

export const revalidate = 0;

export default async function MovementsPage() {
  let movements: StockMovement[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        product:products(name, code, category, default_unit:units(*)),
        unit:units(name, symbol, conversion_factor)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      errorMsg = error.message;
    } else if (data) {
      movements = data as any;
    }
  } catch (err: any) {
    errorMsg = err.message;
  }

  return <MovementsClient initialMovements={movements} error={errorMsg} />;
}
