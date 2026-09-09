"use client";

import Link from "next/link";
import {
  Wheat,
  TrendingUp,
  AlertTriangle,
  Scale,
  Users,
  BarChart3,
  Store,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatETB, formatQuantity } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ManagerDashboardClientProps {
  displayItems: any[];
  valuation: number;
  lowStockList: any[];
}

export function ManagerDashboardClient({
  displayItems,
  valuation,
  lowStockList,
}: ManagerDashboardClientProps) {
  const { t, isAmharic } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("dash_manager_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dash_manager_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 py-1 px-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            {t("owner_manager")} {t("executive")}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Live Stock Valuation */}
        <Card className="border-amber-600/20 shadow-sm bg-gradient-to-br from-amber-500/5 via-card to-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_current_valuation")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-300">
              {formatETB(valuation)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("dash_valuation_math")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Low Stock Alert Trigger */}
        <Card className={`shadow-sm ${lowStockList.length > 0 ? "border-red-500/40 bg-red-50/20" : "border"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_low_stock_warning")}
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${lowStockList.length > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-heading ${lowStockList.length > 0 ? "text-red-600" : "text-foreground"}`}>
              {lowStockList.length} {t("common_items_count")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {lowStockList.length > 0 ? t("dash_low_stock_attention_desc") : t("stock_in_stock")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Commodity Catalog Size */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dash_commodities_tracked")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600">
              <Wheat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-foreground">
              {displayItems.length} {t("common_products_count")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("common_across_branch")}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Store Status */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAmharic ? "የሱቁ የስራ ሁኔታ" : "Store Status"}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 truncate">
              {isAmharic ? "ክፍት / ንቁ" : "Open & Active"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("app_subtitle")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockList.length > 0 && (
        <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-950/20 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-200">
                  {t("dash_low_stock_attention")}
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {t("dash_low_stock_attention_desc")}
                </p>
              </div>
            </div>
            <Link href="/purchases/new">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                {t("btn_receive_new_stock")}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Access Action Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/products" className="group block">
          <Card className="h-full border hover:border-amber-600/60 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {t("nav_products")}
                </CardTitle>
                <Wheat className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground mb-2">
                {t("prod_catalog_desc")}
              </p>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center group-hover:underline">
                {t("btn_show_all")} <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/products/pricing" className="group block">
          <Card className="h-full border hover:border-amber-600/60 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {t("nav_pricing")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground mb-2">
                {t("pricing_page_subtitle")}
              </p>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center group-hover:underline">
                {t("pricing_page_title")} <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/credit" className="group block">
          <Card className="h-full border hover:border-amber-600/60 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {t("nav_credit")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground mb-2">
                {t("credit_page_subtitle")}
              </p>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center group-hover:underline">
                {t("btn_manage_credit")} <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="group block">
          <Card className="h-full border hover:border-amber-600/60 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {t("nav_reports")}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground mb-2">
                {t("reports_subtitle")}
              </p>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center group-hover:underline">
                {t("nav_reports")} <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stock Valuation Breakdown Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">{t("dash_valuation_table_title")}</CardTitle>
            <CardDescription className="text-xs">
              {t("dash_valuation_table_desc")}
            </CardDescription>
          </div>
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="text-xs">
              {t("btn_full_ledger_view")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">{t("prod_name_col")}</th>
                  <th className="px-6 py-3.5">{t("prod_category_col")}</th>
                  <th className="px-6 py-3.5 text-right">{t("inv_on_hand_display")}</th>
                  <th className="px-6 py-3.5 text-right">{t("prod_cost_col")}</th>
                  <th className="px-6 py-3.5 text-right">{t("stock_current_valuation")}</th>
                  <th className="px-6 py-3.5 text-center">{t("common_status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayItems.map((item) => {
                  const factor = item.default_unit_factor || 1;
                  const costPerUnit = factor === 1 ? (item.cost_price_per_base_unit || 0) : (item.cost_price_per_base_unit || 0) * factor;

                  return (
                    <tr key={item.product_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {item.product_category}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatQuantity(
                          item.default_unit_factor === 1 ? item.current_stock_base_units : item.current_stock_default_unit,
                          item.default_unit_symbol
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-foreground">
                        {formatETB(costPerUnit)} / {item.default_unit_symbol}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-900 dark:text-amber-300">
                        {formatETB(item.current_valuation_etb || 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.is_low_stock ? (
                          <Badge variant="warning" className="gap-1 text-[10px]">
                            <AlertTriangle className="h-3 w-3" /> {t("stock_reorder_needed")}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            {t("stock_in_stock")}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
