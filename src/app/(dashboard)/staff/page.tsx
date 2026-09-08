import { createClient } from "@/lib/supabase/server";
import { StaffDashboardClient } from "./StaffDashboardClient";

export const revalidate = 0;

export default async function StaffDashboardPage() {
  let products: any[] = [];
  let recentSales: any[] = [];
  let lowStockProducts: any[] = [];

  try {
    const supabase = createClient();

    // Fetch stock levels from view
    const { data: stockData } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("product_name", { ascending: true })
      .limit(10);

    if (stockData && stockData.length > 0) {
      products = stockData;
      lowStockProducts = stockData.filter((p) => p.is_low_stock);
    }

    // Fetch recent sales
    const { data: salesData } = await supabase
      .from("sales")
      .select("id, invoice_number, customer_name, total_amount, payment_method, sale_date")
      .order("sale_date", { ascending: false })
      .limit(5);

    if (salesData) {
      recentSales = salesData;
    }
  } catch (error) {
    console.error("Staff dashboard fetch error:", error);
  }

  // Fallback demo data for initial viewing before database is populated
  const displayProducts = products.length > 0 ? products : [
    {
      product_id: "demo-1",
      product_name: "Berbere Special Grade 1",
      product_category: "Powders & Spices",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      current_stock_base_units: 45000, // 45 kg
      current_stock_default_unit: 45,
      is_low_stock: false,
    },
    {
      product_id: "demo-2",
      product_name: "Sinde (Wheat Grain)",
      product_category: "Whole Grains",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      current_stock_base_units: 800000, // 8 quintals
      current_stock_default_unit: 8,
      is_low_stock: false,
    },
    {
      product_id: "demo-3",
      product_name: "Ater (Split Yellow Peas)",
      product_category: "Pulses / Legumes",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      current_stock_base_units: 8500, // 8.5 kg - Low Stock!
      current_stock_default_unit: 8.5,
      is_low_stock: true,
    },
    {
      product_id: "demo-4",
      product_name: "Barley / Gebs",
      product_category: "Whole Grains",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      current_stock_base_units: 1200000, // 12 quintals
      current_stock_default_unit: 12,
      is_low_stock: false,
    },
  ];

  return <StaffDashboardClient displayProducts={displayProducts} />;
}
