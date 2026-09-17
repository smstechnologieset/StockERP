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

  return <StaffDashboardClient displayProducts={products} />;
}
