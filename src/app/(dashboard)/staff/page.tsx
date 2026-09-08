import Link from "next/link";
import {
  ShoppingCart,
  PackagePlus,
  Boxes,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Scale,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatETB, formatQuantity } from "@/lib/utils";

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

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Staff Workstation
          </h1>
          <p className="text-sm text-muted-foreground">
            Record sales, log incoming grain shipments, and monitor warehouse stock in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 py-1 px-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Active Session
          </Badge>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Quick Action 1: New POS Sale */}
        <Link href="/sales/new" className="group block">
          <Card className="h-full border-amber-600/30 bg-gradient-to-br from-amber-500/10 via-card to-card hover:border-amber-600 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Point of Sale
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm shadow-amber-600/30 group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Create retail sales invoices, multi-item grain orders, cash & Telebirr payments.
              </p>
              <div className="flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
                Open Sales Register <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Action 2: Record Purchases / Stock-In */}
        <Link href="/purchases/new" className="group block">
          <Card className="h-full border-blue-600/20 bg-gradient-to-br from-blue-500/10 via-card to-card hover:border-blue-600 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Stock-In / Receive
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <PackagePlus className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Log grain shipments received from farmers and suppliers in Quintals or Kg.
              </p>
              <div className="flex items-center text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
                Record Shipment <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Action 3: Current Stock Lookup */}
        <Link href="/inventory" className="group block">
          <Card className="h-full border-emerald-600/20 bg-gradient-to-br from-emerald-500/10 via-card to-card hover:border-emerald-600 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Current Inventory
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <Boxes className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Check current on-hand balances across all commodities normalized to base units.
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                View Stock Levels <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stock Overview Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">Live Commodity Stock Levels</CardTitle>
            <CardDescription className="text-xs">
              Storage single source of truth (normalized to grams, converted to display units)
            </CardDescription>
          </div>
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="text-xs">
              View All Products
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">On Hand (Display)</th>
                  <th className="px-6 py-3 text-right">Base Units (Grams)</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.product_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {p.product_category}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatQuantity(p.current_stock_default_unit, p.default_unit_symbol)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                      {formatQuantity(p.current_stock_base_units, "g")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_low_stock ? (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          In Stock
                        </Badge>
                      )}
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
