import { createClient } from "@/lib/supabase/server";
import { ManagerDashboardClient } from "./ManagerDashboardClient";

export const revalidate = 0;

export default async function ManagerDashboardPage() {
  let stockData: any[] = [];
  let totalValuation = 0;
  let lowStockItems: any[] = [];

  try {
    const supabase = createClient();

    // Query aggregated current stock view
    const { data } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("current_valuation_etb", { ascending: false });

    if (data && data.length > 0) {
      stockData = data;
      totalValuation = data.reduce((acc, item) => acc + (Number(item.current_valuation_etb) || 0), 0);
      lowStockItems = data.filter((item) => item.is_low_stock);
    }
  } catch (error) {
    console.error("Manager dashboard data fetch error:", error);
  }

  // Fallback demo metrics if database has not yet been populated
  const displayItems = stockData.length > 0 ? stockData : [
    {
      product_id: "demo-1",
      product_name: "Berbere Special Grade 1",
      product_category: "Powders & Spices",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      current_stock_base_units: 45000,
      current_stock_default_unit: 45,
      cost_price_per_base_unit: 0.65,
      current_valuation_etb: 29250.0,
      is_low_stock: false,
    },
    {
      product_id: "demo-2",
      product_name: "Sinde (Wheat Grain)",
      product_category: "Whole Grains",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      current_stock_base_units: 800000,
      current_stock_default_unit: 8,
      cost_price_per_base_unit: 0.048,
      current_valuation_etb: 38400.0,
      is_low_stock: false,
    },
    {
      product_id: "demo-3",
      product_name: "Ater (Split Yellow Peas)",
      product_category: "Pulses / Legumes",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      current_stock_base_units: 8500,
      current_stock_default_unit: 8.5,
      cost_price_per_base_unit: 0.12,
      current_valuation_etb: 1020.0,
      is_low_stock: true,
    },
    {
      product_id: "demo-4",
      product_name: "Barley / Gebs",
      product_category: "Whole Grains",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      current_stock_base_units: 1200000,
      current_stock_default_unit: 12,
      cost_price_per_base_unit: 0.042,
      current_valuation_etb: 50400.0,
      is_low_stock: false,
    },
  ];

  const valuation = totalValuation > 0 ? totalValuation : 119070.0;
  const lowStockList = lowStockItems.length > 0 ? lowStockItems : displayItems.filter(i => i.is_low_stock);

  return (
    <ManagerDashboardClient
      displayItems={displayItems}
      valuation={valuation}
      lowStockList={lowStockList}
    />
  );
}
