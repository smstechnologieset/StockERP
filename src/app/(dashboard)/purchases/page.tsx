import { createClient } from "@/lib/supabase/server";
import { PurchasesClient } from "./PurchasesClient";

export const revalidate = 0;

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: { supplierId?: string };
}) {
  let purchases: any[] = [];

  try {
    const supabase = createClient();
    let query = supabase
      .from("purchases")
      .select("*, supplier:suppliers(name, phone), items:purchase_items(*, product:products(name), unit:units(symbol))")
      .order("created_at", { ascending: false });

    if (searchParams.supplierId) {
      query = query.eq("supplier_id", searchParams.supplierId);
    }

    const { data } = await query;
    if (data) purchases = data;
  } catch (error) {
    console.error("Error fetching purchases:", error);
  }

  return <PurchasesClient purchases={purchases} />;
}
