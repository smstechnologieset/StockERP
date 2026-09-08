import Link from "next/link";
import { PackagePlus, Calendar, Building2, Receipt, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatETB } from "@/lib/utils";
import type { Purchase } from "@/types/database";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Stock-In Purchases & Shipments
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit history of supplier grain shipments, delivery invoices, and incoming ledger movements.
          </p>
        </div>

        <Link href="/purchases/new">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <PackagePlus className="h-4 w-4" /> Receive New Stock
          </Button>
        </Link>
      </div>

      {/* Purchases List */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Purchase Order History</CardTitle>
          <CardDescription className="text-xs">
            Every shipment recorded is an immutable positive ledger transaction in base grams.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Waybill / Invoice</th>
                  <th className="px-6 py-3.5">Supplier</th>
                  <th className="px-6 py-3.5">Line Items Summary</th>
                  <th className="px-6 py-3.5 text-right">Total Cost (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {p.purchase_date}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.invoice_reference || (
                        <span className="text-muted-foreground italic font-mono text-xs">
                          {p.id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {p.supplier?.name || "Direct Farmer"}
                      </div>
                      {p.supplier?.phone && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {p.supplier.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {p.items && p.items.length > 0 ? (
                        <div className="space-y-1">
                          {p.items.map((item: any) => (
                            <div key={item.id}>
                              <span className="font-semibold text-foreground">
                                {item.quantity} {item.unit?.symbol}
                              </span>{" "}
                              {item.product?.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Shipment items</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatETB(p.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
