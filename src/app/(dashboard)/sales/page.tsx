import { createClient } from "@/lib/supabase/server";
import { SalesClient } from "./SalesClient";

export const revalidate = 0;

export default async function SalesPage() {
  let sales: any[] = [];
  let totalSalesRevenue = 0;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("sales")
      .select("*, items:sale_items(*, product:products(name), unit:units(symbol))")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      sales = data;
      totalSalesRevenue = data.reduce(
        (sum, s) => sum + (Number(s.total_amount) || 0),
        0
      );
    }
  } catch (error) {
    console.error("Error fetching sales:", error);
  }

  return <SalesClient sales={sales} totalSalesRevenue={totalSalesRevenue} />;
}
