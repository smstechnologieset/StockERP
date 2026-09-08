import Link from "next/link";
import {
  Wheat,
  TrendingUp,
  AlertTriangle,
  Scale,
  Users,
  BarChart3,
  Building2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatETB, formatQuantity } from "@/lib/utils";

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
      cost_price_per_base_unit: 0.65, // 650 ETB / kg
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
      cost_price_per_base_unit: 0.048, // 4,800 ETB / quintal
      current_valuation_etb: 38400.0,
      is_low_stock: false,
    },
    {
      product_id: "demo-3",
      product_name: "Ater (Split Yellow Peas)",
      product_category: "Pulses / Legumes",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      current_stock_base_units: 8500, // 8.5 kg - Below 10 kg threshold!
      current_stock_default_unit: 8.5,
      cost_price_per_base_unit: 0.12, // 120 ETB / kg
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
      cost_price_per_base_unit: 0.042, // 4,200 ETB / quintal
      current_valuation_etb: 50400.0,
      is_low_stock: false,
    },
  ];

  const valuation = totalValuation > 0 ? totalValuation : 119070.0;
  const lowStockList = lowStockItems.length > 0 ? lowStockItems : displayItems.filter(i => i.is_low_stock);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Owner & Manager Overview
            </h1>
            <Badge variant="warning" className="gap-1 py-0.5 text-xs">
              <ShieldCheck className="h-3 w-3" /> Executive
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Inventory valuation, pricing controls, low-stock alerts, and financial performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Wheat className="mr-1.5 h-4 w-4" /> Add Product
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="outline">
              <BarChart3 className="mr-1.5 h-4 w-4" /> Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Stock Valuation */}
        <Card className="border-amber-600/20 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Stock Valuation
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-foreground">
              {formatETB(valuation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on grams on hand &times; cost price
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Low-Stock Alerts */}
        <Card className={lowStockList.length > 0 ? "border-red-500/40 bg-red-50/20 dark:bg-red-950/20" : "border"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Low-Stock Warnings
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-red-600">
              {lowStockList.length} Items
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Below reorder threshold
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Active Commodities */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Commodities Tracked
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-foreground">
              {displayItems.length} Products
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Grains, powders, & pulses
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Branch Status */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trading Location
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-foreground">
              Main Branch
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Addis Ababa Central
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Banner (if any) */}
      {lowStockList.length > 0 && (
        <Card className="border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-card to-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Attention Required: Low Stock Items
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              The following products have fallen below their reorder threshold in grams. Contact suppliers for replenishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockList.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between rounded-lg border border-amber-600/20 bg-background/80 p-3"
                >
                  <div>
                    <h4 className="font-medium text-sm text-foreground">{item.product_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Current: {formatQuantity(item.current_stock_default_unit, item.default_unit_symbol)} ({formatQuantity(item.current_stock_base_units, "g")})
                    </p>
                  </div>
                  <Link href="/purchases/new">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-amber-600/40 text-amber-700">
                      Reorder
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Action Hub */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/products" className="group">
          <Card className="h-full hover:border-amber-600 hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Wheat className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Products & Prices</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjust selling prices, cost baselines, and reorder thresholds.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/suppliers" className="group">
          <Card className="h-full hover:border-amber-600 hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Suppliers & Farmers</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage vendor phone numbers, contracts, and purchase histories.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/units" className="group">
          <Card className="h-full hover:border-amber-600 hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Scale className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Units & Conversions</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure Quintals, 250g packets, sacks, and base gram ratios.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="group">
          <Card className="h-full hover:border-amber-600 hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Reports & Analytics</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily revenue, supplier expense breakdown, and margins.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stock Valuation Breakdown Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">Commodity Inventory & Valuation</CardTitle>
            <CardDescription className="text-xs">
              Live valuation calculated from on-hand grams &times; cost price per gram in ETB
            </CardDescription>
          </div>
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="text-xs">
              Full Ledger View
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">On Hand (Display)</th>
                  <th className="px-6 py-3 text-right">Base Units (Grams)</th>
                  <th className="px-6 py-3 text-right">Estimated Valuation</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayItems.map((p) => (
                  <tr key={p.product_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.product_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {p.product_category}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">
                      {formatQuantity(p.current_stock_default_unit, p.default_unit_symbol)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                      {formatQuantity(p.current_stock_base_units, "g")}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatETB(p.current_valuation_etb)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_low_stock ? (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          Healthy
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
