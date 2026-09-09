"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Calendar,
  CreditCard,
  Printer,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatETB, formatQuantity } from "@/lib/utils";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ReportSaleItem {
  product_name: string;
  quantity_base_units: number;
  sold_display: string;
  total_price: number;
}

export interface ReportSale {
  id: string;
  invoice_number: string;
  date: string; // YYYY-MM-DD
  customer_name: string;
  payment_method: string;
  total_amount: number;
  items: ReportSaleItem[];
}

export interface ReportPurchase {
  id: string;
  purchase_date: string; // YYYY-MM-DD
  supplier_name: string;
  total_cost: number;
  invoice_reference?: string;
}

interface ReportsClientProps {
  allSales: ReportSale[];
  allPurchases: ReportPurchase[];
  categoryValuation: { name: string; value: number; color: string }[];
  lowStockItems: any[];
  creditOutstanding?: number;
  creditCollected?: number;
}

export function ReportsClient({
  allSales,
  allPurchases,
  categoryValuation,
  lowStockItems,
  creditOutstanding = 0,
  creditCollected = 0,
}: ReportsClientProps) {
  const { t, language } = useLanguage();

  // Range state: "day" | "week" | "month" | "custom"
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "custom">("week");
  
  // Custom range date inputs (defaulting to the requested June 2nd – June 21st, 2026 example)
  const [customStart, setCustomStart] = useState<string>("2026-06-02");
  const [customEnd, setCustomEnd] = useState<string>("2026-06-21");

  // Determine active start and end date strings (YYYY-MM-DD)
  const { activeStart, activeEnd } = useMemo(() => {
    // Current application anchor date: 2026-09-09
    const today = new Date("2026-09-09T00:00:00");
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (timeRange === "day") {
      const todayStr = formatDate(today);
      return { activeStart: todayStr, activeEnd: todayStr };
    }
    if (timeRange === "week") {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 6);
      return { activeStart: formatDate(pastWeek), activeEnd: formatDate(today) };
    }
    if (timeRange === "month") {
      const pastMonth = new Date(today);
      pastMonth.setDate(today.getDate() - 29);
      return { activeStart: formatDate(pastMonth), activeEnd: formatDate(today) };
    }
    // Custom range
    return {
      activeStart: customStart || "2026-06-02",
      activeEnd: customEnd || "2026-06-21",
    };
  }, [timeRange, customStart, customEnd]);

  // Filter Sales within the active date range
  const filteredSales = useMemo(() => {
    return allSales
      .filter((s) => {
        const d = s.date.slice(0, 10);
        return d >= activeStart && d <= activeEnd;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allSales, activeStart, activeEnd]);

  // Filter Purchases within the active date range
  const filteredPurchases = useMemo(() => {
    return allPurchases
      .filter((p) => {
        const d = p.purchase_date.slice(0, 10);
        return d >= activeStart && d <= activeEnd;
      })
      .sort((a, b) => a.purchase_date.localeCompare(b.purchase_date));
  }, [allPurchases, activeStart, activeEnd]);

  // Derived Financial KPIs
  const totalRevenue = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.total_amount, 0),
    [filteredSales]
  );
  const totalPurchasesCost = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + p.total_cost, 0),
    [filteredPurchases]
  );
  const netOperatingCashFlow = totalRevenue - totalPurchasesCost;
  const totalValuation = categoryValuation.reduce((sum, c) => sum + c.value, 0);

  // Dynamically Aggregate Top-Selling Commodities in Period
  const topSelling = useMemo(() => {
    const productMap = new Map<string, { grams: number; revenue: number }>();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productMap.get(item.product_name) || { grams: 0, revenue: 0 };
        productMap.set(item.product_name, {
          grams: existing.grams + item.quantity_base_units,
          revenue: existing.revenue + item.total_price,
        });
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => {
        let soldDisplay = `${data.grams.toLocaleString()} g`;
        if (data.grams >= 100000) {
          soldDisplay = `${(data.grams / 100000).toFixed(1)} ${language === "am" ? "ኩንታል" : "quintals"}`;
        } else if (data.grams >= 1000) {
          soldDisplay = `${(data.grams / 1000).toFixed(1)} kg`;
        }

        return {
          name,
          soldGrams: data.grams,
          soldDisplay,
          revenue: Number(data.revenue.toFixed(2)),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, language]);

  // Dynamically Aggregate Supplier Procurement in Period
  const supplierBreakdown = useMemo(() => {
    const supMap = new Map<string, { totalCost: number; shipments: number }>();

    filteredPurchases.forEach((p) => {
      const name = p.supplier_name;
      const existing = supMap.get(name) || { totalCost: 0, shipments: 0 };
      supMap.set(name, {
        totalCost: existing.totalCost + p.total_cost,
        shipments: existing.shipments + 1,
      });
    });

    return Array.from(supMap.entries())
      .map(([name, data]) => ({
        name,
        totalCost: Number(data.totalCost.toFixed(2)),
        shipments: data.shipments,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredPurchases]);

  // Dynamically Generate Daily Revenue Timeline for AreaChart
  const timelineData = useMemo(() => {
    const start = new Date(activeStart + "T00:00:00");
    const end = new Date(activeEnd + "T00:00:00");
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Map sales by date string (YYYY-MM-DD)
    const salesByDay = new Map<string, { revenue: number; orders: number }>();
    filteredSales.forEach((s) => {
      const day = s.date.slice(0, 10);
      const existing = salesByDay.get(day) || { revenue: 0, orders: 0 };
      salesByDay.set(day, {
        revenue: existing.revenue + s.total_amount,
        orders: existing.orders + 1,
      });
    });

    // If span is 31 days or fewer, generate every single date sequentially
    if (diffDays >= 0 && diffDays <= 31) {
      const points: { date: string; fullDate: string; revenue: number; orders: number }[] = [];
      const curr = new Date(start);

      while (curr <= end) {
        const dStr = curr.toISOString().split("T")[0];
        const info = salesByDay.get(dStr) || { revenue: 0, orders: 0 };
        const label = curr.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        points.push({
          date: label,
          fullDate: dStr,
          revenue: info.revenue,
          orders: info.orders,
        });
        curr.setDate(curr.getDate() + 1);
      }
      return points;
    }

    // For longer spans, return points for dates that have sales
    return Array.from(salesByDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dStr, data]) => {
        const dateObj = new Date(dStr + "T00:00:00");
        const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          date: label,
          fullDate: dStr,
          revenue: data.revenue,
          orders: data.orders,
        };
      });
  }, [filteredSales, activeStart, activeEnd]);

  // Export to Excel / CSV Handler
  const handleExportExcel = () => {
    const periodLabel = `${activeStart} to ${activeEnd}`;
    const generatedOn = new Date().toLocaleString();

    const rows: string[][] = [
      ["STOCKERP - SHOP STOCK & INVENTORY MANAGEMENT"],
      ["OFFICIAL BUSINESS PERFORMANCE & VALUATION REPORT"],
      [`Report Period: ${periodLabel}`],
      [`Generated On: ${generatedOn}`],
      [],
      ["1. EXECUTIVE FINANCIAL SUMMARY"],
      ["Metric", "Value (ETB / Count)"],
      ["Total Sales Revenue", totalRevenue.toFixed(2)],
      ["Supplier Procurement Expenses", totalPurchasesCost.toFixed(2)],
      ["Net Operating Cash Flow", netOperatingCashFlow.toFixed(2)],
      ["Sales Invoices Count", filteredSales.length.toString()],
      ["Shipments Received Count", filteredPurchases.length.toString()],
      ["Current On-Hand Warehouse Stock Valuation", totalValuation.toFixed(2)],
      [],
      ["2. TOP-SELLING COMMODITIES IN PERIOD"],
      ["Rank", "Commodity Name", "Volume Sold", "Total Revenue (ETB)"],
      ...topSelling.map((prod, idx) => [
        `#${idx + 1}`,
        prod.name,
        prod.soldDisplay,
        prod.revenue.toFixed(2),
      ]),
      [],
      ["3. SUPPLIER PROCUREMENT EXPENSES IN PERIOD"],
      ["Supplier / Farmer Cooperative", "Shipments Received", "Total Cost (ETB)"],
      ...supplierBreakdown.map((sup) => [
        sup.name,
        sup.shipments.toString(),
        sup.totalCost.toFixed(2),
      ]),
      [],
      ["4. ITEMIZED SALES INVOICES IN PERIOD"],
      ["Date", "Invoice #", "Customer Name", "Payment Method", "Amount (ETB)"],
      ...filteredSales.map((s) => [
        s.date,
        s.invoice_number,
        s.customer_name,
        s.payment_method.toUpperCase(),
        s.total_amount.toFixed(2),
      ]),
      [],
      ["5. ITEMIZED SHIPMENT PURCHASES IN PERIOD"],
      ["Date", "Supplier / Cooperative", "Reference", "Total Cost (ETB)"],
      ...filteredPurchases.map((p) => [
        p.purchase_date,
        p.supplier_name,
        p.invoice_reference || "Direct Receipt",
        p.total_cost.toFixed(2),
      ]),
    ];

    const csvContent =
      "\uFEFF" +
      rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `StockERP_Report_${activeStart}_to_${activeEnd}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF Handler
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Printable Report View (Visible only when printing) */}
      <div className="hidden print:block space-y-6 text-black">
        <div className="border-b-2 border-black pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">
                {t("reports_print_header")}
              </h1>
              <p className="text-sm font-medium mt-1">
                {language === "am" ? "የእህል፣ የቅመማ ቅመም እና የጥራጥሬ መደብር" : "Grain, Pulse & Spice Trading Shop ERP"}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold">{t("reports_generated_at")}: {new Date().toLocaleString()}</p>
              <p className="text-gray-600">{t("reports_prepared_by")}: Manager</p>
            </div>
          </div>
          <div className="mt-3 inline-block bg-gray-100 border px-3 py-1 text-xs font-semibold rounded">
            {t("reports_selected_period")}: {activeStart} &rarr; {activeEnd} ({filteredSales.length} sales, {filteredPurchases.length} shipments)
          </div>
        </div>

        {/* Print Financial Summary Cards */}
        <div className="grid grid-cols-4 gap-4 border p-4 bg-gray-50 rounded">
          <div>
            <div className="text-xs text-gray-600 font-semibold">{t("reports_sales_rev")}</div>
            <div className="text-lg font-bold">{formatETB(totalRevenue)}</div>
            <div className="text-[11px] text-gray-500">{filteredSales.length} {t("reports_sales_count")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 font-semibold">{t("reports_supplier_purch")}</div>
            <div className="text-lg font-bold">{formatETB(totalPurchasesCost)}</div>
            <div className="text-[11px] text-gray-500">{filteredPurchases.length} {t("reports_purchases_count")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 font-semibold">{t("reports_net_margin")}</div>
            <div className="text-lg font-bold">{formatETB(netOperatingCashFlow)}</div>
            <div className="text-[11px] text-gray-500">{netOperatingCashFlow >= 0 ? "Positive Cash Flow" : "Deficit"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 font-semibold">{t("stock_current_valuation")}</div>
            <div className="text-lg font-bold">{formatETB(totalValuation)}</div>
            <div className="text-[11px] text-gray-500">{t("common_on_hand_warehouse")}</div>
          </div>
        </div>

        {/* Print Top Selling Table */}
        <div>
          <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
            {t("reports_top_selling")} ({activeStart} - {activeEnd})
          </h3>
          <table className="w-full text-xs text-left border">
            <thead className="bg-gray-100 border-b font-semibold">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">{language === "am" ? "የእህል ስም" : "Commodity"}</th>
                <th className="p-2 text-right">{language === "am" ? "የተሸጠ መጠን" : "Volume Sold"}</th>
                <th className="p-2 text-right">{language === "am" ? "የተገኘ ገቢ" : "Revenue (ETB)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topSelling.map((p, idx) => (
                <tr key={p.name}>
                  <td className="p-2 font-semibold">#{idx + 1}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-right">{p.soldDisplay}</td>
                  <td className="p-2 text-right font-semibold">{formatETB(p.revenue)}</td>
                </tr>
              ))}
              {topSelling.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-gray-500">{t("reports_no_data_range")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Print Supplier Procurement Table */}
        <div>
          <h3 className="font-bold text-sm border-b pb-1 mb-2 uppercase tracking-wide">
            {t("reports_sup_spending")} ({activeStart} - {activeEnd})
          </h3>
          <table className="w-full text-xs text-left border">
            <thead className="bg-gray-100 border-b font-semibold">
              <tr>
                <th className="p-2">{language === "am" ? "አቅራቢ / የገበሬዎች ማህበር" : "Supplier / Cooperative"}</th>
                <th className="p-2 text-right">{language === "am" ? "የገቡ ጭነቶች" : "Shipments"}</th>
                <th className="p-2 text-right">{language === "am" ? "ጠቅላላ ወጪ" : "Total Cost (ETB)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supplierBreakdown.map((s) => (
                <tr key={s.name}>
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2 text-right">{s.shipments}</td>
                  <td className="p-2 text-right font-semibold">{formatETB(s.totalCost)}</td>
                </tr>
              ))}
              {supplierBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-gray-500">{t("reports_no_data_range")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Manager Sign-off line */}
        <div className="pt-8 border-t mt-8 flex justify-between text-xs">
          <div>
            <p className="font-semibold">{t("reports_prepared_by")}: __________________________</p>
            <p className="text-gray-500 mt-1">Date: __________________________</p>
          </div>
          <div>
            <p className="font-semibold">{t("reports_approved_by")}: __________________________</p>
            <p className="text-gray-500 mt-1">Stamp / Seal: [ Official Seal ]</p>
          </div>
        </div>
      </div>

      {/* Screen Interactive View */}
      <div className="print:hidden space-y-6">
        {/* Header Strip with Title & Export Actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
              {t("reports_title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("reports_subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              className="h-9 gap-1.5 border-amber-600/30 text-foreground hover:bg-amber-500/10"
              title="Save or Print PDF Report"
            >
              <Printer className="h-4 w-4 text-red-600" />
              <span>{t("reports_export_pdf")}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-9 gap-1.5 border-emerald-600/30 text-foreground hover:bg-emerald-500/10"
              title="Export structured CSV for Excel"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{t("reports_export_excel")}</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-xl border bg-card/60 p-4 backdrop-blur shadow-sm space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Timeline Segmented Buttons */}
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 p-1">
              <Button
                size="sm"
                variant={timeRange === "day" ? "default" : "ghost"}
                onClick={() => setTimeRange("day")}
                className="text-xs h-8 font-medium"
              >
                {t("reports_daily")}
              </Button>
              <Button
                size="sm"
                variant={timeRange === "week" ? "default" : "ghost"}
                onClick={() => setTimeRange("week")}
                className="text-xs h-8 font-medium"
              >
                {t("reports_weekly")}
              </Button>
              <Button
                size="sm"
                variant={timeRange === "month" ? "default" : "ghost"}
                onClick={() => setTimeRange("month")}
                className="text-xs h-8 font-medium"
              >
                {t("reports_monthly")}
              </Button>
              <Button
                size="sm"
                variant={timeRange === "custom" ? "default" : "ghost"}
                onClick={() => setTimeRange("custom")}
                className="text-xs h-8 font-medium gap-1"
              >
                <Calendar className="h-3.5 w-3.5" />
                {t("reports_custom")}
              </Button>
            </div>

            {/* Quick Demo Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 hidden md:inline">
                {language === "am" ? "ፈጣን ምሳሌዎች፡" : "Presets:"}
              </span>
              <Badge
                variant="outline"
                className={`cursor-pointer hover:bg-amber-500/20 text-xs py-1 transition-all ${
                  timeRange === "custom" && customStart === "2026-06-02" && customEnd === "2026-06-21"
                    ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold"
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  setTimeRange("custom");
                  setCustomStart("2026-06-02");
                  setCustomEnd("2026-06-21");
                }}
              >
                📅 {t("reports_preset_june")}
              </Badge>
              <Badge
                variant="outline"
                className={`cursor-pointer hover:bg-amber-500/20 text-xs py-1 transition-all ${
                  timeRange === "day" ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold" : "text-muted-foreground"
                }`}
                onClick={() => setTimeRange("day")}
              >
                {t("reports_preset_today")}
              </Badge>
              <Badge
                variant="outline"
                className={`cursor-pointer hover:bg-amber-500/20 text-xs py-1 transition-all ${
                  timeRange === "week" ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold" : "text-muted-foreground"
                }`}
                onClick={() => setTimeRange("week")}
              >
                {t("reports_preset_week")}
              </Badge>
              <Badge
                variant="outline"
                className={`cursor-pointer hover:bg-amber-500/20 text-xs py-1 transition-all ${
                  timeRange === "month" ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold" : "text-muted-foreground"
                }`}
                onClick={() => setTimeRange("month")}
              >
                {t("reports_preset_month")}
              </Badge>
            </div>
          </div>

          {/* Custom Date Range Selector (when Custom is selected) */}
          {timeRange === "custom" && (
            <div className="pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-500/5 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {t("reports_start_date")}:
                </span>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 text-xs w-40 bg-background"
                />
              </div>

              <span className="text-muted-foreground text-xs hidden sm:inline">&rarr;</span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {t("reports_end_date")}:
                </span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 text-xs w-40 bg-background"
                />
              </div>

              <div className="text-xs text-muted-foreground italic sm:ml-auto">
                {language === "am"
                  ? "ሁሉንም ስታትስቲክስ በዚህ የጊዜ ገደብ ለማየት ቀኖቹን ያስተካክሉ"
                  : "All KPIs, graphs, and tables recalculate instantly for this range"}
              </div>
            </div>
          )}

          {/* Active Period Status Strip */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong className="text-foreground font-semibold">{t("reports_selected_period")}:</strong>{" "}
                {activeStart} &rarr; {activeEnd}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                <strong className="text-foreground">{filteredSales.length}</strong> {t("reports_sales_count")}
              </span>
              <span>•</span>
              <span>
                <strong className="text-foreground">{filteredPurchases.length}</strong> {t("reports_purchases_count")}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards Strip - Dynamically updates based on the selected timeline */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Total Sales Revenue */}
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("reports_sales_rev")}
              </CardTitle>
              <div className="p-1.5 bg-emerald-500/10 rounded-md">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatETB(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {filteredSales.length} {t("reports_sales_count")}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 2. Warehouse Stock Valuation (On Hand) */}
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("stock_current_valuation")}
              </CardTitle>
              <div className="p-1.5 bg-amber-500/10 rounded-md">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                {formatETB(totalValuation)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("common_on_hand_warehouse")}
              </p>
            </CardContent>
          </Card>

          {/* 3. Supplier Purchases Cost */}
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("reports_supplier_purch")}
              </CardTitle>
              <div className="p-1.5 bg-blue-500/10 rounded-md">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatETB(totalPurchasesCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <PackageCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>
                  {filteredPurchases.length} {t("reports_purchases_count")}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* 4. Net Cash Flow in Selected Period */}
          <Card className={`border shadow-sm hover:shadow-md transition-shadow ${
            netOperatingCashFlow >= 0 ? "border-emerald-600/30 bg-emerald-50/10" : "border-amber-600/30 bg-amber-50/10"
          }`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("reports_net_margin")}
              </CardTitle>
              {netOperatingCashFlow >= 0 ? (
                <div className="p-1.5 bg-emerald-500/15 rounded-md">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                </div>
              ) : (
                <div className="p-1.5 bg-amber-500/15 rounded-md">
                  <ArrowDownRight className="h-4 w-4 text-amber-600" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                netOperatingCashFlow >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
              }`}>
                {formatETB(netOperatingCashFlow)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "am" ? "የሽያጭ ገቢ ሲቀነስ የግዢ ወጪ" : "Sales Revenue minus Purchases"}
              </p>
            </CardContent>
          </Card>

          {/* 5. Outstanding Credit or Low Stock Alert */}
          {lowStockItems.length > 0 ? (
            <Card className="border-red-500/40 bg-red-50/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("stock_low_stock_warning")}
                </CardTitle>
                <div className="p-1.5 bg-red-500/10 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {lowStockItems.length} {t("common_products_count")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("common_action_required_mgr")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-600/30 bg-amber-50/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("credit_total_outstanding")}
                </CardTitle>
                <div className="p-1.5 bg-amber-500/10 rounded-md">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </div>
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
          )}
        </div>

        {/* Row 1 Charts: Revenue Timeline & Category Valuation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Trend Area Chart (7 cols) */}
          <Card className="lg:col-span-7 shadow-sm border">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {t("reports_rev_timeline")}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({activeStart} &rarr; {activeEnd})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("common_daily_pos_desc")}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="w-fit text-xs font-mono">
                  {timelineData.length} {language === "am" ? "ቀናት ታይተዋል" : "Data Points"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {timelineData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
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
                        formatter={(value: any, name: any) => [
                          formatETB(Number(value)),
                          language === "am" ? "ገቢ" : "Revenue",
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]?.payload?.fullDate) {
                            return `${label} (${payload[0].payload.fullDate})`;
                          }
                          return label;
                        }}
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
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  {t("reports_no_data_range")}
                </div>
              )}
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
                      formatter={(value: any) => [
                        formatETB(Number(value)),
                        language === "am" ? "የገንዘብ ግምት" : "Valuation",
                      ]}
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
          {/* Top Selling Products in Period (6 cols) */}
          <Card className="lg:col-span-6 shadow-sm border">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {t("reports_top_selling")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === "am"
                      ? "በተመረጠው የጊዜ ገደብ ውስጥ በከፍተኛ የሽያጭ መጠን እና ገቢ የተሸጡ እህሎች"
                      : `Top-performing commodities between ${activeStart} and ${activeEnd}`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {topSelling.length} {language === "am" ? "ምርቶች" : "Items"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {topSelling.length > 0 ? (
                <div className="divide-y max-h-[380px] overflow-y-auto">
                  {topSelling.map((prod, index) => (
                    <div
                      key={prod.name}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 font-bold text-xs text-amber-700 dark:text-amber-400">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{prod.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {language === "am" ? "የተሸጠው መጠን" : "Volume"}:{" "}
                            <span className="font-medium text-foreground">{prod.soldDisplay}</span>
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
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("reports_no_data_range")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Procurement Cost Breakdown in Period (6 cols) */}
          <Card className="lg:col-span-6 shadow-sm border">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {t("reports_sup_spending")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === "am"
                      ? "ለገበሬ ማህበራትና ለጅምላ አቅራቢዎች የወጣ ጠቅላላ ወጪ"
                      : `Procurement expenses distributed across suppliers between ${activeStart} and ${activeEnd}`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {supplierBreakdown.length} {language === "am" ? "አቅራቢዎች" : "Suppliers"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {supplierBreakdown.length > 0 ? (
                <div className="divide-y max-h-[380px] overflow-y-auto">
                  {supplierBreakdown.map((sup) => (
                    <div
                      key={sup.name}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{sup.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {sup.shipments}{" "}
                          {language === "am"
                            ? "የገቡ ጭነቶች ተመዝግበዋል"
                            : "Incoming Shipments Logged"}
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
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("reports_no_data_range")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low-Stock Reorder Priority Center */}
        {lowStockItems.length > 0 && (
          <Card className="border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-card to-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base font-bold text-foreground">
                  {language === "am"
                    ? "ሊያልቁ የተቃረቡ እቃዎች የማዘዣ ማዕከል"
                    : "Low-Stock Reorder Priority Center"}
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
                          {formatQuantity(
                            item.current_stock_default_unit,
                            item.default_unit_symbol
                          )}{" "}
                          ({formatQuantity(item.current_stock_base_units, "g")})
                        </td>
                        <td className="px-6 py-3 text-right text-muted-foreground font-mono text-xs">
                          {formatQuantity(item.reorder_threshold_base_units, "g")}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link href="/purchases/new">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            >
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
    </div>
  );
}
