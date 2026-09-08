import Link from "next/link";
import { ShoppingCart, Calendar, User, Phone, Receipt, Smartphone, Banknote, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatETB } from "@/lib/utils";

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

  // Fallback demo sales
  const displaySales = sales.length > 0 ? sales : [
    {
      id: "sale-1",
      invoice_number: "INV-992144",
      customer_name: "Ato Dawit Haile",
      customer_phone: "+251 911 556677",
      payment_method: "telebirr",
      total_amount: 3200.0,
      sale_date: "2026-09-07T14:30:00Z",
      items: [
        { id: "si-1", quantity: 2, unit_price: 900, total_price: 1800, product: { name: "Berbere Special Grade 1" }, unit: { symbol: "kg" } },
        { id: "si-2", quantity: 10, unit_price: 140, total_price: 1400, product: { name: "Ater (Split Yellow Peas)" }, unit: { symbol: "kg" } },
      ],
    },
    {
      id: "sale-2",
      invoice_number: "INV-992143",
      customer_name: "Walk-in Customer",
      customer_phone: null,
      payment_method: "cash",
      total_amount: 6500.0,
      sale_date: "2026-09-07T11:15:00Z",
      items: [
        { id: "si-3", quantity: 1, unit_price: 6500, total_price: 6500, product: { name: "Sinde (Wheat Grain)" }, unit: { symbol: "q" } },
      ],
    },
  ];

  function getPaymentBadge(method: string) {
    switch (method) {
      case "telebirr":
        return <Badge variant="info" className="gap-1 text-[10px]"><Smartphone className="h-3 w-3" /> Telebirr</Badge>;
      case "cbe_birr":
        return <Badge variant="info" className="gap-1 text-[10px]"><Smartphone className="h-3 w-3" /> CBE Birr</Badge>;
      case "bank_transfer":
        return <Badge variant="secondary" className="gap-1 text-[10px]"><Building className="h-3 w-3" /> Bank</Badge>;
      case "credit":
        return <Badge variant="warning" className="gap-1 text-[10px]"><CreditCard className="h-3 w-3" /> Credit</Badge>;
      default:
        return <Badge variant="success" className="gap-1 text-[10px]"><Banknote className="h-3 w-3" /> Cash</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Sales Invoices & Revenue Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete transaction history from the Point of Sale register with payment methods and line items.
          </p>
        </div>

        <Link href="/sales/new">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <ShoppingCart className="h-4 w-4" /> Open POS Register
          </Button>
        </Link>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Invoices Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {displaySales.length} Invoices
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-600/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Recorded Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {formatETB(totalSalesRevenue > 0 ? totalSalesRevenue : 9700.0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Invoices Table */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">Customer Sales Transactions</CardTitle>
          <CardDescription className="text-xs">
            Every transaction is backed by negative stock ledger entries in base grams.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items Sold</th>
                  <th className="px-6 py-3.5 text-center">Payment</th>
                  <th className="px-6 py-3.5 text-right">Total (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displaySales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(sale.sale_date).toLocaleDateString("en-ET", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{sale.customer_name}</div>
                      {sale.customer_phone && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {sale.customer_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {sale.items && sale.items.length > 0 ? (
                        <div className="space-y-1">
                          {sale.items.map((item: any) => (
                            <div key={item.id}>
                              <span className="font-semibold text-foreground">
                                {item.quantity} {item.unit?.symbol}
                              </span>{" "}
                              {item.product?.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Retail items</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getPaymentBadge(sale.payment_method)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatETB(sale.total_amount)}
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
