"use client";

import Link from "next/link";
import {
  ShoppingCart,
  PackagePlus,
  Boxes,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface StaffDashboardClientProps {
  displayProducts: any[];
}

export function StaffDashboardClient({ displayProducts }: StaffDashboardClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("dash_staff_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dash_staff_subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 py-1 px-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            {t("active_session")}
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
                {t("dash_pos_card_title")}
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm shadow-amber-600/30 group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("dash_pos_card_desc")}
              </p>
              <div className="flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
                {t("dash_pos_card_action")} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Action 2: Record Purchases / Stock-In */}
        <Link href="/purchases/new" className="group block">
          <Card className="h-full border-blue-600/20 bg-gradient-to-br from-blue-500/10 via-card to-card hover:border-blue-600 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {t("dash_receive_card_title")}
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <PackagePlus className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("dash_receive_card_desc")}
              </p>
              <div className="flex items-center text-xs font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
                {t("dash_receive_card_action")} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Action 3: Current Stock Lookup */}
        <Link href="/inventory" className="group block">
          <Card className="h-full border-emerald-600/20 bg-gradient-to-br from-emerald-500/10 via-card to-card hover:border-emerald-600 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {t("dash_inventory_card_title")}
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <Boxes className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                {t("dash_inventory_card_desc")}
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                {t("dash_inventory_card_action")} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stock Overview Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg">{t("dash_live_stock_levels")}</CardTitle>
            <CardDescription className="text-xs">
              {t("dash_live_stock_desc")}
            </CardDescription>
          </div>
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="text-xs">
              {t("common_all_products")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3">{t("prod_name_col")}</th>
                  <th className="px-6 py-3">{t("prod_category_col")}</th>
                  <th className="px-6 py-3 text-right">{t("inv_on_hand_display")}</th>
                  <th className="px-6 py-3 text-center">{t("common_status")}</th>
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
                      {formatQuantity(
                        p.default_unit_factor === 1 ? p.current_stock_base_units : p.current_stock_default_unit,
                        p.default_unit_symbol
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.is_low_stock ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
