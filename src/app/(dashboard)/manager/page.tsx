import { createClient } from "@/lib/supabase/server";
import { ManagerDashboardClient, DashboardActivity } from "./ManagerDashboardClient";

export const revalidate = 0;

export default async function ManagerDashboardPage() {
  let stockData: any[] = [];
  let totalValuation = 0;
  let lowStockItems: any[] = [];
  let salesData: any[] = [];
  let purchasesData: any[] = [];
  let movementsData: any[] = [];

  try {
    const supabase = createClient();

    // 1. Query aggregated current stock view
    const { data: stockResult } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("current_valuation_etb", { ascending: false });

    if (stockResult && stockResult.length > 0) {
      stockData = stockResult;
      totalValuation = stockResult.reduce((acc, item) => acc + (Number(item.current_valuation_etb) || 0), 0);
      lowStockItems = stockResult.filter((item) => item.is_low_stock);
    }

    // 2. Query sales for total sales calculation & recent sales activities
    const { data: salesResult } = await supabase
      .from("sales")
      .select("id, invoice_number, customer_name, total_amount, payment_method, sale_date, created_at")
      .order("created_at", { ascending: false });

    if (salesResult) {
      salesData = salesResult;
    }

    // 3. Query recent purchases (goods receipts)
    const { data: purchasesResult } = await supabase
      .from("purchases")
      .select("id, invoice_reference, total_cost, purchase_date, created_at, supplier:suppliers(name)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (purchasesResult) {
      purchasesData = purchasesResult;
    }

    // 4. Query stock adjustments
    const { data: movementsResult } = await supabase
      .from("stock_movements")
      .select("id, movement_type, quantity_base_units, notes, created_at, product:products(name, default_unit:units(symbol))")
      .in("movement_type", ["adjustment_in", "adjustment_out"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (movementsResult) {
      movementsData = movementsResult;
    }
  } catch (error) {
    console.error("Manager dashboard data fetch error:", error);
  }

  // Display real database metrics only (0 if empty)
  const displayItems = stockData;
  const valuation = totalValuation;
  const lowStockList = lowStockItems;

  // Total sales calculation from database
  const totalSalesRevenue = salesData.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  const totalSalesCount = salesData.length;

  // Compile unified recent activities list from real database events
  const realActivities: DashboardActivity[] = [];

  salesData.slice(0, 10).forEach((s) => {
    realActivities.push({
      id: `sale-${s.id}`,
      type: "sale",
      title: s.invoice_number ? `Invoice #${s.invoice_number}` : "Sales Invoice",
      description: s.customer_name ? `Customer: ${s.customer_name}` : "Walk-in Customer",
      amount: Number(s.total_amount) || 0,
      paymentMethod: s.payment_method || "cash",
      timestamp: s.created_at || s.sale_date || new Date().toISOString(),
      link: "/sales",
    });
  });

  purchasesData.slice(0, 10).forEach((p) => {
    realActivities.push({
      id: `purch-${p.id}`,
      type: "purchase",
      title: p.invoice_reference ? `Stock In: ${p.invoice_reference}` : "Goods Receipt",
      description: (p.supplier as any)?.name ? `Supplier: ${(p.supplier as any).name}` : "Supplier Delivery",
      amount: Number(p.total_cost) || 0,
      timestamp: p.created_at || p.purchase_date || new Date().toISOString(),
      link: "/purchases",
    });
  });

  movementsData.slice(0, 10).forEach((m) => {
    const prodName = (m.product as any)?.name || "Commodity";
    const unitSymbol = (m.product as any)?.default_unit?.symbol || "g";
    const qty = Number(m.quantity_base_units) || 0;
    realActivities.push({
      id: `adj-${m.id}`,
      type: "adjustment",
      title: `Stock Adjustment: ${prodName}`,
      description: m.notes || "Physical stock count reconciliation",
      quantity: `${qty > 0 ? "+" : ""}${qty} ${unitSymbol}`,
      timestamp: m.created_at || new Date().toISOString(),
      link: "/inventory/movements",
    });
  });

  // Sort activities by timestamp descending
  realActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recentActivities = realActivities.slice(0, 10);

  return (
    <ManagerDashboardClient
      displayItems={displayItems}
      valuation={valuation}
      lowStockList={lowStockList}
      totalSalesRevenue={totalSalesRevenue}
      totalSalesCount={totalSalesCount}
      recentActivities={recentActivities}
    />
  );
}

