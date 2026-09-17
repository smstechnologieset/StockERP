import { createClient } from "@/lib/supabase/server";
import { ReportsClient, ReportSale, ReportPurchase } from "./ReportsClient";

export const revalidate = 0;

export default async function ReportsPage() {
  let allSales: ReportSale[] = [];
  let allPurchases: ReportPurchase[] = [];
  let categoryValuation: { name: string; value: number; color: string }[] = [];
  let lowStockItems: any[] = [];
  let allStockItems: any[] = [];
  let allCredits: any[] = [];
  let creditOutstanding = 0;
  let creditCollected = 0;

  try {
    const supabase = createClient();

    const [stockRes, salesRes, purchasesRes, creditsRes] = await Promise.all([
      supabase.from("view_product_current_stock").select("*"),
      supabase.from("sales").select("*, items:sale_items(*, product:products(name))"),
      supabase.from("purchases").select("*, supplier:suppliers(name)"),
      supabase.from("customer_credits").select("*, sale:sales(invoice_number)"),
    ]);

    // Customer Credit Accounts
    if (creditsRes.data && creditsRes.data.length > 0) {
      allCredits = creditsRes.data;
      creditOutstanding = creditsRes.data.reduce(
        (sum, c) => sum + (Number(c.remaining_balance) || 0),
        0
      );
      creditCollected = creditsRes.data.reduce(
        (sum, c) => sum + (Number(c.paid_amount) || 0),
        0
      );
    }

    // Process Stock Valuation by Category
    if (stockRes.data && stockRes.data.length > 0) {
      allStockItems = stockRes.data;
      const catMap = new Map<string, number>();
      stockRes.data.forEach((item) => {
        const cat = item.product_category || "Other";
        const val = Number(item.current_valuation_etb) || 0;
        catMap.set(cat, (catMap.get(cat) || 0) + val);
      });

      const colors = ["#d97706", "#dc2626", "#059669", "#7c3aed", "#2563eb"];
      let cIndex = 0;
      categoryValuation = Array.from(catMap.entries()).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        color: colors[cIndex++ % colors.length],
      }));

      lowStockItems = stockRes.data.filter((item) => item.is_low_stock);
    }

    // Map Live Sales from Supabase
    if (salesRes.data && salesRes.data.length > 0) {
      allSales = salesRes.data.map((s: any) => {
        const dateStr = s.sale_date
          ? s.sale_date.split("T")[0]
          : s.created_at
          ? s.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0];

        const items = (s.items || []).map((it: any) => {
          const qty = Number(it.quantity_base_units) || 0;
          let display = `${qty} g`;
          if (qty >= 100000) {
            display = `${(qty / 100000).toFixed(1)} quintals`;
          } else if (qty >= 1000) {
            display = `${(qty / 1000).toFixed(1)} kg`;
          }

          return {
            product_name: it.product?.name || "Commodity",
            quantity_base_units: qty,
            sold_display: display,
            total_price: Number(it.total_price) || 0,
          };
        });

        return {
          id: s.id,
          invoice_number: s.invoice_number || `INV-${s.id.slice(0, 6)}`,
          date: dateStr,
          customer_name: s.customer_name || "Walk-in Customer",
          payment_method: s.payment_method || "cash",
          total_amount: Number(s.total_amount) || 0,
          items,
        };
      });
    }

    // Map Live Purchases from Supabase
    if (purchasesRes.data && purchasesRes.data.length > 0) {
      allPurchases = purchasesRes.data.map((p: any) => {
        const dateStr = p.purchase_date
          ? p.purchase_date.split("T")[0]
          : p.created_at
          ? p.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0];

        return {
          id: p.id,
          purchase_date: dateStr,
          supplier_name: p.supplier?.name || "Direct / Local Farmer",
          total_cost: Number(p.total_cost) || 0,
          transport_cost: Number(p.transport_cost) || 0,
          labor_cost: Number(p.labor_cost) || 0,
          invoice_reference: p.invoice_reference || undefined,
        };
      });
    }
  } catch (error) {
    console.error("Reports page data processing error:", error);
  }

  return (
    <ReportsClient
      allSales={allSales}
      allPurchases={allPurchases}
      categoryValuation={categoryValuation}
      lowStockItems={lowStockItems}
      creditOutstanding={creditOutstanding}
      creditCollected={creditCollected}
      allStockItems={allStockItems}
      allCredits={allCredits}
    />
  );
}
