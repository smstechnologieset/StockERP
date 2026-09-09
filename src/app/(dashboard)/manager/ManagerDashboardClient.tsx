"use client";

import Link from "next/link";
import {
  Wheat,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Sliders,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatETB } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface DashboardActivity {
  id: string;
  type: "sale" | "purchase" | "adjustment";
  title: string;
  description: string;
  amount?: number;
  quantity?: string;
  paymentMethod?: string;
  timestamp: string;
  link: string;
}

interface ManagerDashboardClientProps {
  displayItems: any[];
  valuation: number;
  lowStockList: any[];
  totalSalesRevenue: number;
  totalSalesCount: number;
  recentActivities: DashboardActivity[];
}

export function ManagerDashboardClient({
  displayItems,
  valuation,
  lowStockList,
  totalSalesRevenue,
  totalSalesCount,
  recentActivities,
}: ManagerDashboardClientProps) {
  const { t, isAmharic } = useLanguage();

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString(isAmharic ? "am-ET" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const getPaymentBadge = (method?: string) => {
    if (!method) return null;
    const m = method.toLowerCase();
    if (m === "cash") {
      return (
        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300">
          {isAmharic ? "ጥሬ ገንዘብ" : "Cash"}
        </Badge>
      );
    }
    if (m === "telebirr") {
      return (
        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-300">
          Telebirr
        </Badge>
      );
    }
    if (m === "credit") {
      return (
        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-300">
          {isAmharic ? "በብድር" : "Credit"}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px]">
        {method}
      </Badge>
    );
  };

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

      {/* KPI Cards Strip - Exactly 4 Essential Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Stock Valuation */}
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

        {/* KPI 2: Low-Stock Warnings */}
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

        {/* KPI 3: Commodities Tracked */}
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
              {isAmharic ? "በሱቁ የተመዘገቡ ንቁ ምርቶች" : "Active commodities in inventory"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Total Sale done */}
        <Card className="border-emerald-600/20 shadow-sm bg-gradient-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dash_total_sales_done")}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400">
              {formatETB(totalSalesRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalSalesCount} {t("dash_total_sales_count")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockList.length > 0 && (
        <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-950/20 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600 shrink-0">
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

      {/* Recent Activities Done Section */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                {t("dash_recent_activities_title")}
              </CardTitle>
              <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary">
                {recentActivities.length}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              {t("dash_recent_activities_desc")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sales">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("btn_view_sales_log")}
              </Button>
            </Link>
            <Link href="/inventory/movements">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <Sliders className="h-3.5 w-3.5" />
                {isAmharic ? "የእንቅስቃሴዎች መዝገብ" : "Movements Log"}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("dash_no_activities")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-3.5">{t("dash_activity_type")}</th>
                    <th className="px-6 py-3.5">{t("dash_activity_details")}</th>
                    <th className="px-6 py-3.5 text-right">{t("dash_activity_amount")}</th>
                    <th className="px-6 py-3.5 text-right">{t("dash_activity_time")}</th>
                    <th className="px-6 py-3.5 text-center">{t("common_actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentActivities.map((act) => {
                    const isSale = act.type === "sale";
                    const isPurchase = act.type === "purchase";
                    const isAdjustment = act.type === "adjustment";

                    return (
                      <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                        {/* Type Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isSale && (
                            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300">
                              <ShoppingCart className="h-3 w-3" />
                              {t("dash_activity_sale")}
                            </Badge>
                          )}
                          {isPurchase && (
                            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-300">
                              <Truck className="h-3 w-3" />
                              {t("dash_activity_purchase")}
                            </Badge>
                          )}
                          {isAdjustment && (
                            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-300">
                              <Sliders className="h-3 w-3" />
                              {t("dash_activity_adjustment")}
                            </Badge>
                          )}
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {act.title}
                              </span>
                              {getPaymentBadge(act.paymentMethod)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {act.description}
                            </span>
                          </div>
                        </td>

                        {/* Amount / Impact */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isSale && (
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              +{formatETB(act.amount || 0)}
                            </span>
                          )}
                          {isPurchase && (
                            <span className="font-bold text-sky-700 dark:text-sky-400">
                              {formatETB(act.amount || 0)}
                            </span>
                          )}
                          {isAdjustment && (
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                              {act.quantity || "—"}
                            </span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-6 py-4 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(act.timestamp)}
                        </td>

                        {/* Action Link */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <Link href={act.link}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

