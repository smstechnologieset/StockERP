"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Boxes,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatETB, formatQuantity } from "@/lib/utils";
import Link from "next/link";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CreditCard } from "lucide-react";

interface ReportsClientProps {
  revenueDaily: { date: string; revenue: number; orders: number }[];
  categoryValuation: { name: string; value: number; color: string }[];
  topSelling: { name: string; soldGrams: number; soldDisplay: string; revenue: number }[];
  supplierBreakdown: { name: string; totalCost: number; shipments: number }[];
  lowStockItems: any[];
  creditOutstanding?: number;
  creditCollected?: number;
}

export function ReportsClient({
  revenueDaily,
  categoryValuation,
  topSelling,
  supplierBreakdown,
  lowStockItems,
  creditOutstanding = 0,
  creditCollected = 0,
}: ReportsClientProps) {
  const { t, language } = useLanguage();
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  const totalRevenue = revenueDaily.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalValuation = categoryValuation.reduce((acc, curr) => acc + curr.value, 0);
  const totalPurchases = supplierBreakdown.reduce((acc, curr) => acc + curr.totalCost, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("reports_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("reports_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
          <Button
            size="sm"
            variant={timeRange === "day" ? "default" : "ghost"}
            onClick={() => setTimeRange("day")}
            className="text-xs h-7"
          >
            {t("reports_daily")}
          </Button>
          <Button
            size="sm"
            variant={timeRange === "week" ? "default" : "ghost"}
            onClick={() => setTimeRange("week")}
            className="text-xs h-7"
          >
            {t("reports_weekly")}
          </Button>
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "ghost"}
            onClick={() => setTimeRange("month")}
            className="text-xs h-7"
          >
            {t("reports_monthly")}
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("reports_sales_rev")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatETB(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("common_all_payment_channels")}</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_current_valuation")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {formatETB(totalValuation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("common_on_hand_warehouse")}</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("reports_supplier_purch")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatETB(totalPurchases)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("common_procurement_expenses")}</p>
          </CardContent>
        </Card>

        <Card className={lowStockItems.length > 0 ? "border-red-500/40 bg-red-50/20" : "border"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_low_stock_warning")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems.length} {t("common_products_count")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("common_action_required_mgr")}</p>
          </CardContent>
        </Card>

        {/* Credit Outstanding */}
        <Card className="border-amber-600/30 bg-amber-50/10 dark:bg-amber-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("credit_total_outstanding")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {formatETB(creditOutstanding)}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {language === "am" ? "የተሰበሰበ፡ " : "Collected: "}{formatETB(creditCollected)}
              </span>
              <Link href="/credit" className="text-xs font-semibold text-amber-600 hover:underline">
                {language === "am" ? "አስተዳድር" : "Manage"} &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts: Revenue Timeline & Category Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Area Chart (7 cols) */}
        <Card className="lg:col-span-7 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  {t("reports_rev_timeline")} ({timeRange === "day" ? t("reports_daily") : timeRange === "week" ? t("reports_weekly") : t("reports_monthly")})
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("common_daily_pos_desc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueDaily}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [formatETB(Number(value)), language === "am" ? "ገቢ" : "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stock Valuation by Category (5 cols) */}
        <Card className="lg:col-span-5 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t("reports_cat_valuation")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("common_distribution_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryValuation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryValuation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatETB(Number(value)), language === "am" ? "የገንዘብ ግምት" : "Valuation"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs">
              {categoryValuation.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Selling Products & Supplier Procurement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (6 cols) */}
        <Card className="lg:col-span-6 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t("reports_top_selling")}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "am" ? "በከፍተኛ የሽያጭ መጠን እና ገቢ የተሸጡ እህሎች" : "Highest turnover products by sales volume & revenue"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topSelling.map((prod, index) => (
                <div
                  key={prod.name}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 font-bold text-xs text-amber-700">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{prod.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {language === "am" ? "የተሸጠው መጠን" : "Volume"}: <span className="font-medium text-foreground">{prod.soldDisplay}</span> ({formatQuantity(prod.soldGrams, "g")})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatETB(prod.revenue)}</div>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {language === "am" ? "የተገኘ ገቢ" : "Revenue"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Procurement Cost Breakdown (6 cols) */}
        <Card className="lg:col-span-6 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t("reports_sup_spending")}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === "am" ? "ለገበሬ ማህበራትና ለጅምላ አቅራቢዎች የወጣ ጠቅላላ ወጪ" : "Expenses distributed across farming cooperatives and wholesalers"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {supplierBreakdown.map((sup) => (
                <div
                  key={sup.name}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{sup.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {sup.shipments} {language === "am" ? "የገቡ ጭነቶች ተመዝግበዋል" : "Incoming Shipments Logged"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatETB(sup.totalCost)}</div>
                    <span className="text-[11px] text-muted-foreground">
                      {language === "am" ? "ጠቅላላ ወጪ" : "Total Spent"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low-Stock Reorder Action Center */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-card to-card">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-bold text-foreground">
                {language === "am" ? "ሊያልቁ የተቃረቡ እቃዎች የማዘዣ ማዕከል" : "Low-Stock Reorder Priority Center"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {language === "am"
                ? "ያለው ክምችት የማስጠንቀቂያ መጠኑ ላይ የደረሰ ወይም ያነሰ። መጋዘኑን ለመሙላት አዲስ እቃ ይቀበሉ።"
                : "Grams on hand have reached or dropped below reorder threshold. Generate purchase orders to replenish warehouse stock."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-3">{language === "am" ? "እህል / ምርት" : "Commodity"}</th>
                    <th className="px-6 py-3 text-right">{t("inv_on_hand_display")}</th>
                    <th className="px-6 py-3 text-right">{t("prod_reorder_col")}</th>
                    <th className="px-6 py-3 text-right">{t("common_actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowStockItems.map((item) => (
                    <tr key={item.product_id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-3 text-right text-red-600 font-bold">
                        {formatQuantity(item.current_stock_default_unit, item.default_unit_symbol)} ({formatQuantity(item.current_stock_base_units, "g")})
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground font-mono text-xs">
                        {formatQuantity(item.reorder_threshold_base_units, "g")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link href="/purchases/new">
                          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                            {t("btn_receive_stock")}
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
      )}
    </div>
  );
}
