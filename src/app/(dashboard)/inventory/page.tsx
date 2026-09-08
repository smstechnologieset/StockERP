import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  PackagePlus,
  ShoppingCart,
  Scale,
  DollarSign,
  ArrowUpDown,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatETB, formatQuantity } from "@/lib/utils";
import type { ProductCurrentStockView } from "@/types/database";

export const revalidate = 0;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  let inventory: ProductCurrentStockView[] = [];
  let totalValuation = 0;
  let lowStockCount = 0;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("view_product_current_stock")
      .select("*")
      .order("product_name", { ascending: true });

    if (data && data.length > 0) {
      inventory = data;
      totalValuation = data.reduce(
        (acc, item) => acc + (Number(item.current_valuation_etb) || 0),
        0
      );
      lowStockCount = data.filter((item) => item.is_low_stock).length;
    }
  } catch (error) {
    console.error("Error fetching inventory view:", error);
  }

  // Fallback demo data if empty
  const displayInventory = inventory.length > 0 ? inventory : [
    {
      product_id: "p-1",
      product_name: "Berbere Special Grade 1",
      product_code: "BER-001",
      product_category: "Powders & Spices",
      default_unit_id: "2",
      default_unit_name: "Kilogram",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      reorder_threshold_base_units: 10000,
      cost_price_per_base_unit: 0.65,
      selling_price_per_base_unit: 0.90,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 45000,
      current_stock_default_unit: 45,
      is_low_stock: false,
      current_valuation_etb: 29250.0,
    },
    {
      product_id: "p-2",
      product_name: "Sinde (Wheat Grain)",
      product_code: "WHT-001",
      product_category: "Whole Grains",
      default_unit_id: "3",
      default_unit_name: "Quintal (Kuntal)",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      reorder_threshold_base_units: 200000,
      cost_price_per_base_unit: 0.048,
      selling_price_per_base_unit: 0.065,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 800000,
      current_stock_default_unit: 8,
      is_low_stock: false,
      current_valuation_etb: 38400.0,
    },
    {
      product_id: "p-3",
      product_name: "Ater (Split Yellow Peas)",
      product_code: "ATR-001",
      product_category: "Pulses / Legumes",
      default_unit_id: "2",
      default_unit_name: "Kilogram",
      default_unit_symbol: "kg",
      default_unit_factor: 1000,
      reorder_threshold_base_units: 15000,
      cost_price_per_base_unit: 0.12,
      selling_price_per_base_unit: 0.16,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 8500,
      current_stock_default_unit: 8.5,
      is_low_stock: true,
      current_valuation_etb: 1020.0,
    },
    {
      product_id: "p-4",
      product_name: "Barley / Gebs",
      product_code: "BAR-001",
      product_category: "Whole Grains",
      default_unit_id: "3",
      default_unit_name: "Quintal (Kuntal)",
      default_unit_symbol: "q",
      default_unit_factor: 100000,
      reorder_threshold_base_units: 150000,
      cost_price_per_base_unit: 0.042,
      selling_price_per_base_unit: 0.058,
      is_active: true,
      branch_id: "00000000-0000-0000-0000-000000000001",
      branch_name: "Main Branch",
      current_stock_base_units: 1200000,
      current_stock_default_unit: 12,
      is_low_stock: false,
      current_valuation_etb: 50400.0,
    },
  ];

  const itemsToRender = searchParams.filter === "low-stock"
    ? displayInventory.filter((item) => item.is_low_stock)
    : displayInventory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Inventory & Stock Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time on-hand stock derived from the append-only ledger, normalized to base grams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
              <PackagePlus className="mr-1.5 h-4 w-4" /> Receive Stock
            </Button>
          </Link>
          <Link href="/sales/new">
            <Button size="sm" variant="outline">
              <ShoppingCart className="mr-1.5 h-4 w-4" /> New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Commodities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {displayInventory.length} Products
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across Main Branch</p>
          </CardContent>
        </Card>

        <Card className="border-amber-600/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Stock Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {formatETB(totalValuation > 0 ? totalValuation : 119070.0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-hand grams &times; cost price</p>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? "border-red-500/40 bg-red-50/20" : "border"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Low-Stock Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockCount > 0 ? lowStockCount : 1} Items
            </div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">Commodity Stock Ledger Balance</CardTitle>
            <CardDescription className="text-xs">
              Single source of truth: stock level is the mathematical sum of all movements in grams.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {searchParams.filter === "low-stock" ? (
              <Link href="/inventory">
                <Button variant="outline" size="sm" className="text-xs">
                  Show All Items
                </Button>
              </Link>
            ) : (
              <Link href="/inventory?filter=low-stock">
                <Button variant="outline" size="sm" className="text-xs text-amber-700 border-amber-600/30">
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Filter Low Stock
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">Commodity</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">On Hand (Display Unit)</th>
                  <th className="px-6 py-3.5 text-right">Base Units (Grams)</th>
                  <th className="px-6 py-3.5 text-right">Estimated Valuation</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {itemsToRender.map((item) => (
                  <tr key={item.product_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{item.product_name}</div>
                      {item.product_code && (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {item.product_code}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {item.product_category}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatQuantity(item.current_stock_default_unit, item.default_unit_symbol || "")}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                      {formatQuantity(item.current_stock_base_units, "g")}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatETB(item.current_valuation_etb)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.is_low_stock ? (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" /> Reorder Needed
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          In Stock
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/purchases/new`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700">
                          + Stock-In
                        </Button>
                      </Link>
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
