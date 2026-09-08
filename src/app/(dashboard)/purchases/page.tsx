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

  // Fallback sample data if no purchases yet
  const displayPurchases = purchases.length > 0 ? purchases : [
    {
      id: "purch-1",
      purchase_date: "2026-09-06",
      invoice_reference: "WB-8812",
      total_cost: 48000.0,
      notes: "10 quintals Sinde from Arsi harvest",
      supplier: { name: "Arsi Bale Farmers Grain Cooperative", phone: "+251 911 234567" },
      items: [
        { id: "i-1", quantity: 10, unit_cost: 4800, total_cost: 48000, product: { name: "Sinde (Wheat Grain)" }, unit: { symbol: "q" } }
      ]
    },
    {
      id: "purch-2",
      purchase_date: "2026-09-04",
      invoice_reference: "REC-332",
      total_cost: 32500.0,
      notes: "Grade 1 Berbere batches",
      supplier: { name: "Merkato Spice Wholesalers Union", phone: "+251 922 987654" },
      items: [
        { id: "i-2", quantity: 50, unit_cost: 650, total_cost: 32500, product: { name: "Berbere Special Grade 1" }, unit: { symbol: "kg" } }
      ]
    },
  ];

  const finalPurchases = purchases.length > 0 ? purchases : displayPurchases;

  return <PurchasesClient purchases={finalPurchases} />;
}
