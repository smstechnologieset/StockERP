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
import { EthiopianDatePicker } from "@/components/ui/EthiopianDatePicker";
import { generateExecutiveExcelReport } from "@/lib/exportExcel";
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
  transport_cost?: number;
  labor_cost?: number;
  invoice_reference?: string;
}

interface ReportsClientProps {
  allSales: ReportSale[];
  allPurchases: ReportPurchase[];
  categoryValuation: { name: string; value: number; color: string }[];
  lowStockItems: any[];
  creditOutstanding?: number;
  creditCollected?: number;
  allStockItems?: any[];
  allCredits?: any[];
}

export function ReportsClient({
  allSales,
  allPurchases,
  categoryValuation,
  lowStockItems,
  creditOutstanding = 0,
  creditCollected = 0,
  allStockItems = [],
  allCredits = [],
}: ReportsClientProps) {
  const { t, tCategory, formatEthDate, formatEthDateTime, language, isAmharic } = useLanguage();

  // Range state: "day" | "week" | "month" | "custom"
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "custom">("week");
  
  // Custom range date inputs (defaulting to start of current month until today)
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Determine active start and end date strings (YYYY-MM-DD)
  const { activeStart, activeEnd } = useMemo(() => {
    const today = new Date();
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
      activeStart: customStart || formatDate(today),
      activeEnd: customEnd || formatDate(today),
    };
  }, [timeRange, customStart, customEnd]);

  // Translate category valuation names
  const translatedCategoryValuation = useMemo(() => {
    return categoryValuation.map((cat) => ({
      ...cat,
      name: tCategory(cat.name),
    }));
  }, [categoryValuation, tCategory]);

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
  const totalTransportCost = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + (Number(p.transport_cost) || 0), 0),
    [filteredPurchases]
  );
  const totalLaborCost = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + (Number(p.labor_cost) || 0), 0),
    [filteredPurchases]
  );
  const totalGoodsCost = useMemo(
    () => Math.max(0, totalPurchasesCost - totalTransportCost - totalLaborCost),
    [totalPurchasesCost, totalTransportCost, totalLaborCost]
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
        const label = formatEthDate(curr, { includeYear: false });
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
        const label = formatEthDate(dateObj, { includeYear: false });
        return {
          date: label,
          fullDate: dStr,
          revenue: data.revenue,
          orders: data.orders,
        };
      });
  }, [filteredSales, activeStart, activeEnd]);

  // Export to Multi-Sheet Styled Excel (.xlsx) Handler
  const handleExportExcel = () => {
    // Map Inventory items with full unit costs, selling prices, margins and accumulated valuations
    const mappedInventory = (allStockItems || []).map((item) => {
      const qty = item.default_unit_factor === 1
        ? Number(item.current_stock_base_units) || 0
        : Number(item.current_stock_default_unit) || 0;

      const factor = Number(item.default_unit_factor) || 1;
      const unitCost = Number(item.base_cost_price) || (Number(item.cost_price_per_base_unit) * factor) || 0;
      const unitSelling = Number(item.base_selling_price) || (Number(item.selling_price_per_base_unit) * factor) || 0;
      const margin = Math.max(0, unitSelling - unitCost);
      const marginPct = unitCost > 0 ? (margin / unitCost) * 100 : 0;
      const valCost = Number(item.current_valuation_etb) || (unitCost * qty);
      const valSelling = unitSelling * qty;
      const unrealizedProfit = valSelling - valCost;

      return {
        name: item.product_name,
        category: tCategory(item.product_category),
        currentStockDisplay: formatQuantity(qty, item.default_unit_symbol),
        baseUnitsGrams: Number(item.current_stock_base_units) || 0,
        unitCostPrice: Number(unitCost.toFixed(2)),
        unitSellingPrice: Number(unitSelling.toFixed(2)),
        marginETB: Number(margin.toFixed(2)),
        marginPercent: Number(marginPct.toFixed(1)),
        valuationAtCostETB: Number(valCost.toFixed(2)),
        valuationAtSellingETB: Number(valSelling.toFixed(2)),
        unrealizedProfitETB: Number(unrealizedProfit.toFixed(2)),
        status: item.is_low_stock ? (isAmharic ? "ዝቅተኛ ክምችት" : "Low Stock") : (isAmharic ? "ጥሩ ክምችት" : "In Stock"),
      };
    });

    const totalPotentialStockValuation = mappedInventory.reduce((sum, it) => sum + it.valuationAtSellingETB, 0);
    const totalPotentialUnrealizedProfit = mappedInventory.reduce((sum, it) => sum + it.unrealizedProfitETB, 0);

    // Map Customer Credits Ledger
    const mappedCredits = (allCredits || []).map((c) => {
      const ethCreated = c.created_at ? formatEthDate(c.created_at) : "-";
      const gregCreated = c.created_at ? (typeof c.created_at === "string" ? c.created_at.slice(0, 10) : "-") : "-";
      const ethDue = c.due_date ? formatEthDate(c.due_date) : "-";
      const gregDue = c.due_date ? (typeof c.due_date === "string" ? c.due_date.slice(0, 10) : "-") : "-";
      const totalCred = Number(c.total_credit_amount) || 0;
      const paid = Number(c.paid_amount) || 0;
      const remaining = Number(c.remaining_balance) !== undefined
        ? Number(c.remaining_balance)
        : Math.max(0, totalCred - paid);

      let statusStr = isAmharic ? "ያልተከፈለ" : "Unpaid";
      if (c.status === "paid" || remaining <= 0) {
        statusStr = isAmharic ? "የተከፈለ" : "Paid";
      } else if (c.status === "partially_paid" || paid > 0) {
        statusStr = isAmharic ? "በከፊል የተከፈለ" : "Partially Paid";
      }

      return {
        customerName: c.customer_name || "Customer",
        customerPhone: c.customer_phone || "-",
        invoiceNumber: c.sale?.invoice_number || (c.sale_id ? `INV-${c.sale_id.slice(0, 6)}` : "-"),
        ethiopianDate: ethCreated,
        gregorianDate: gregCreated,
        ethiopianDueDate: ethDue,
        gregorianDueDate: gregDue,
        totalCreditAmount: Number(totalCred.toFixed(2)),
        paidAmount: Number(paid.toFixed(2)),
        remainingBalance: Number(remaining.toFixed(2)),
        status: statusStr,
      };
    });

    generateExecutiveExcelReport({
      reportPeriodEthiopian: `${formatEthDate(activeStart)} - ${formatEthDate(activeEnd)}`,
      reportPeriodGregorian: `${activeStart} to ${activeEnd}`,
      generatedDateEthiopian: formatEthDateTime(new Date()),
      generatedDateGregorian: new Date().toLocaleString(),
      preparedBy: "Owner / Manager",
      totalSalesRevenue: totalRevenue,
      totalGoodsPurchasesCost: totalGoodsCost,
      totalTransportCost,
      totalLaborCost,
      totalPurchasesCost,
      netOperatingCashFlow,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
      currentStockValuation: totalValuation,
      potentialStockValuation: totalPotentialStockValuation,
      potentialUnrealizedProfit: totalPotentialUnrealizedProfit,
      creditOutstanding,
      creditCollected,
      topSelling: topSelling.map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        soldDisplay: p.soldDisplay,
        soldGrams: p.soldGrams,
        revenue: p.revenue,
      })),
      supplierSpending: supplierBreakdown.map((s) => ({
        name: s.name,
        shipments: s.shipments,
        totalCost: s.totalCost,
      })),
      sales: filteredSales.map((s) => ({
        ethiopianDate: formatEthDate(s.date),
        gregorianDate: s.date,
        invoiceNumber: s.invoice_number,
        customerName: s.customer_name,
        paymentMethod: s.payment_method,
        itemsSummary: s.items.map((it) => `${it.product_name} (${it.sold_display})`).join("; "),
        totalAmount: s.total_amount,
      })),
      purchases: filteredPurchases.map((p) => {
        const transport = Number(p.transport_cost) || 0;
        const labor = Number(p.labor_cost) || 0;
        const itemsCost = Math.max(0, p.total_cost - transport - labor);
        return {
          ethiopianDate: formatEthDate(p.purchase_date),
          gregorianDate: p.purchase_date,
          supplierName: p.supplier_name,
          reference: p.invoice_reference || "Direct Receipt",
          itemsCost,
          transportCost: transport,
          laborCost: labor,
          totalCost: p.total_cost,
        };
      }),
      inventory: mappedInventory,
      credits: mappedCredits,
    }, "StockERP_Master_Report");
  };

  // Export to PDF Handler
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Printable Multi-Page Report View (Visible only when printing) */}
      <div className="hidden print:block text-black bg-white">
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm 12mm 12mm 12mm;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page-break {
              break-before: page !important;
              page-break-before: always !important;
            }
            .print-avoid-break {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            thead {
              display: table-header-group !important;
            }
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}</style>

        {/* ========================================================= */}
        {/* PAGE 1: EXECUTIVE FINANCIAL OVERVIEW & TOP PERFORMERS      */}
        {/* ========================================================= */}
        <div className="space-y-6 pb-6">
          {/* Header */}
          <div className="border-b-2 border-black pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight">
                  {t("reports_print_header")}
                </h1>
                <p className="text-sm font-medium mt-1 text-gray-700">
                  {language === "am"
                    ? "እስቶክ ኢአርፒ የእህል፣ የቅመማ ቅመም እና የጥራጥሬ መደብር"
                    : "StockERP • Grain, Pulse & Spice Trading Shop ERP"}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">{t("reports_generated_at")}: {formatEthDateTime(new Date())}</p>
                <p className="text-gray-600">{t("reports_prepared_by")}: Manager</p>
                <p className="text-gray-500 text-[10px] mt-0.5 font-mono">Status: Official Verified Audit</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between bg-gray-100 border px-3 py-1.5 text-xs font-semibold rounded">
              <span>
                {t("reports_selected_period")}: <strong className="text-black">{formatEthDate(activeStart)} &rarr; {formatEthDate(activeEnd)}</strong>
                <span className="font-normal text-gray-600 ml-1">({activeStart} to {activeEnd})</span>
              </span>
              <span className="text-gray-700">
                {filteredSales.length} {t("reports_sales_count")}, {filteredPurchases.length} {t("reports_purchases_count")}
              </span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-4 gap-3 border p-3 bg-gray-50 rounded">
            <div className="border-r pr-2">
              <div className="text-[11px] text-gray-600 font-semibold uppercase">{t("reports_sales_rev")}</div>
              <div className="text-lg font-bold text-black">{formatETB(totalRevenue)}</div>
              <div className="text-[10px] text-gray-500">{filteredSales.length} {t("reports_sales_count")}</div>
            </div>
            <div className="border-r pr-2">
              <div className="text-[11px] text-gray-600 font-semibold uppercase">{t("reports_supplier_purch")}</div>
              <div className="text-lg font-bold text-black">{formatETB(totalPurchasesCost)}</div>
              <div className="text-[10px] text-gray-500">{filteredPurchases.length} {t("reports_purchases_count")}</div>
              {(totalTransportCost > 0 || totalLaborCost > 0) && (
                <div className="text-[9px] text-gray-600 mt-1 leading-tight">
                  <span>Goods: {formatETB(totalGoodsCost)}</span>
                  {totalTransportCost > 0 && <span> • Trsp: +{formatETB(totalTransportCost)}</span>}
                  {totalLaborCost > 0 && <span> • Lbr: +{formatETB(totalLaborCost)}</span>}
                </div>
              )}
            </div>
            <div className="border-r pr-2">
              <div className="text-[11px] text-gray-600 font-semibold uppercase">{t("reports_net_margin")}</div>
              <div className="text-lg font-bold text-black">{formatETB(netOperatingCashFlow)}</div>
              <div className="text-[10px] text-gray-500 font-medium">
                {netOperatingCashFlow >= 0 ? "Operating Surplus" : "Operating Deficit"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-600 font-semibold uppercase">{t("stock_current_valuation")}</div>
              <div className="text-lg font-bold text-black">{formatETB(totalValuation)}</div>
              <div className="text-[10px] text-gray-500">{t("common_on_hand_warehouse")}</div>
            </div>
          </div>

          {/* Top-Selling Commodities Table */}
          <div>
            <h3 className="font-bold text-xs border-b border-black pb-1 mb-2 uppercase tracking-wide flex justify-between">
              <span>{t("reports_top_selling")} ({formatEthDate(activeStart)} - {formatEthDate(activeEnd)})</span>
              <span className="text-gray-500 font-normal">{topSelling.length} items</span>
            </h3>
            <table className="w-full text-xs text-left border border-gray-300">
              <thead className="bg-gray-100 border-b border-gray-300 font-semibold">
                <tr>
                  <th className="p-1.5 w-10 text-center">#</th>
                  <th className="p-1.5">{language === "am" ? "የእህል ስም" : "Commodity Name"}</th>
                  <th className="p-1.5 text-right">{language === "am" ? "የተሸጠ መጠን" : "Volume Sold"}</th>
                  <th className="p-1.5 text-right">{language === "am" ? "የተገኘ ገቢ (ብር)" : "Revenue (ETB)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topSelling.map((p, idx) => (
                  <tr key={p.name}>
                    <td className="p-1.5 text-center font-medium">#{idx + 1}</td>
                    <td className="p-1.5 font-semibold">{p.name}</td>
                    <td className="p-1.5 text-right">{p.soldDisplay}</td>
                    <td className="p-1.5 text-right font-bold">{formatETB(p.revenue)}</td>
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

          {/* Supplier Procurement Spending Table */}
          <div>
            <h3 className="font-bold text-xs border-b border-black pb-1 mb-2 uppercase tracking-wide flex justify-between">
              <span>{t("reports_sup_spending")} ({formatEthDate(activeStart)} - {formatEthDate(activeEnd)})</span>
              <span className="text-gray-500 font-normal">{supplierBreakdown.length} suppliers</span>
            </h3>
            <table className="w-full text-xs text-left border border-gray-300">
              <thead className="bg-gray-100 border-b border-gray-300 font-semibold">
                <tr>
                  <th className="p-1.5">{language === "am" ? "አቅራቢ / የገበሬዎች ማህበር" : "Supplier / Cooperative"}</th>
                  <th className="p-1.5 text-center">{language === "am" ? "የገቡ ጭነቶች" : "Shipments"}</th>
                  <th className="p-1.5 text-right">{language === "am" ? "ጠቅላላ ወጪ (ብር)" : "Total Cost (ETB)"}</th>
                  <th className="p-1.5 text-right">{language === "am" ? "ድርሻ" : "Share"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierBreakdown.map((s) => {
                  const share = totalPurchasesCost > 0 ? (s.totalCost / totalPurchasesCost) * 100 : 0;
                  return (
                    <tr key={s.name}>
                      <td className="p-1.5 font-medium">{s.name}</td>
                      <td className="p-1.5 text-center">{s.shipments}</td>
                      <td className="p-1.5 text-right font-bold">{formatETB(s.totalCost)}</td>
                      <td className="p-1.5 text-right font-medium text-gray-600">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {supplierBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500">{t("reports_no_data_range")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <span>StockERP Business System • Confidential Executive Summary</span>
            <span>ገጽ 1 ከ 4 • Page 1 of 4</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAGE 2: ITEMIZED SALES INVOICES LEDGER                     */}
        {/* ========================================================= */}
        <div className="print-page-break space-y-4 pt-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {language === "am" ? "ክፍል 1፡ የሽያጭ ደረሰኞች" : "PART 1: SALES LEDGER"}
              </span>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {language === "am" ? "የተከናወኑ የሽያጭ ደረሰኞች ዝርዝር" : "Itemized Sales Transactions Ledger"}
              </h2>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold">{formatEthDate(activeStart)} &rarr; {formatEthDate(activeEnd)}</span>
              <p className="text-[10px] text-gray-500">{filteredSales.length} Invoices</p>
            </div>
          </div>

          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 border-b border-gray-300 font-semibold">
              <tr>
                <th className="p-1.5 w-8 text-center">#</th>
                <th className="p-1.5">{language === "am" ? "ቀን (የኢትዮጵያ)" : "Date (Eth)"}</th>
                <th className="p-1.5">{language === "am" ? "ደረሰኝ #" : "Invoice #"}</th>
                <th className="p-1.5">{language === "am" ? "የደንበኛ ስም" : "Customer"}</th>
                <th className="p-1.5 text-center">{language === "am" ? "አከፋፈል" : "Method"}</th>
                <th className="p-1.5">{language === "am" ? "የተሸጡ እህሎችና መጠኖች" : "Commodities & Quantities"}</th>
                <th className="p-1.5 text-right">{language === "am" ? "ጠቅላላ ብር" : "Total (ETB)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((s, idx) => (
                <tr key={s.id || idx}>
                  <td className="p-1.5 text-center text-gray-500">{idx + 1}</td>
                  <td className="p-1.5 font-medium whitespace-nowrap">{formatEthDate(s.date)}</td>
                  <td className="p-1.5 font-mono font-semibold">{s.invoice_number}</td>
                  <td className="p-1.5">{s.customer_name}</td>
                  <td className="p-1.5 text-center uppercase text-[10px] font-semibold">{s.payment_method}</td>
                  <td className="p-1.5 text-[11px] text-gray-700">
                    {s.items.map((it) => `${it.product_name} (${it.sold_display})`).join(", ")}
                  </td>
                  <td className="p-1.5 text-right font-bold">{formatETB(s.total_amount)}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">{t("reports_no_data_range")}</td>
                </tr>
              )}
            </tbody>
            {filteredSales.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
                <tr>
                  <td colSpan={6} className="p-2 text-right uppercase">
                    {language === "am" ? "ጠቅላላ የሽያጭ ገቢ ድምር (Total Sales):" : "Total Sales Revenue:"}
                  </td>
                  <td className="p-2 text-right text-sm font-bold text-emerald-800">{formatETB(totalRevenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Page 2 Footer */}
          <div className="pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <span>StockERP Sales Register • {filteredSales.length} Transactions</span>
            <span>ገጽ 2 ከ 4 • Page 2 of 4</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAGE 3: ITEMIZED PURCHASES & DELIVERIES LEDGER            */}
        {/* ========================================================= */}
        <div className="print-page-break space-y-4 pt-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                {language === "am" ? "ክፍል 2፡ የግዢ ጭነቶች" : "PART 2: PROCUREMENT LEDGER"}
              </span>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {language === "am" ? "የገቡ የግዢ ጭነቶች ዝርዝር" : "Itemized Procurement & Shipments Ledger"}
              </h2>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold">{formatEthDate(activeStart)} &rarr; {formatEthDate(activeEnd)}</span>
              <p className="text-[10px] text-gray-500">{filteredPurchases.length} Shipments</p>
            </div>
          </div>

          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 border-b border-gray-300 font-semibold">
              <tr>
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">{language === "am" ? "የደረሰበት ቀን (Eth)" : "Delivery Date (Eth)"}</th>
                <th className="p-2">{language === "am" ? "አቅራቢ / የገበሬዎች ማህበር" : "Supplier / Cooperative"}</th>
                <th className="p-2">{language === "am" ? "የደረሰኝ / ዌይቢል ቁጥር" : "Waybill / Invoice Ref"}</th>
                <th className="p-2 text-right">{language === "am" ? "የእቃዎች ዋጋ" : "Goods (ETB)"}</th>
                <th className="p-2 text-right">{language === "am" ? "ትራንስፖርት" : "Transport"}</th>
                <th className="p-2 text-right">{language === "am" ? "የማውረጃ (ኩሊ)" : "Labor"}</th>
                <th className="p-2 text-right">{language === "am" ? "ጠቅላላ ወጪ (ብር)" : "Total Landed (ETB)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPurchases.map((p, idx) => {
                const trsp = Number(p.transport_cost) || 0;
                const lbr = Number(p.labor_cost) || 0;
                const goods = Math.max(0, p.total_cost - trsp - lbr);
                return (
                  <tr key={p.id || idx}>
                    <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-2 font-medium whitespace-nowrap">{formatEthDate(p.purchase_date)}</td>
                    <td className="p-2 font-semibold">{p.supplier_name}</td>
                    <td className="p-2 font-mono">{p.invoice_reference || "Direct Receipt"}</td>
                    <td className="p-2 text-right font-medium">{formatETB(goods)}</td>
                    <td className="p-2 text-right text-gray-700">{trsp > 0 ? `+${formatETB(trsp)}` : "-"}</td>
                    <td className="p-2 text-right text-gray-700">{lbr > 0 ? `+${formatETB(lbr)}` : "-"}</td>
                    <td className="p-2 text-right font-bold">{formatETB(p.total_cost)}</td>
                  </tr>
                );
              })}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">{t("reports_no_data_range")}</td>
                </tr>
              )}
            </tbody>
            {filteredPurchases.length > 0 && (
              <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
                <tr>
                  <td colSpan={4} className="p-2 text-right uppercase">
                    {language === "am" ? "ድምር (Totals):" : "Totals:"}
                  </td>
                  <td className="p-2 text-right text-xs font-bold text-gray-900">{formatETB(totalGoodsCost)}</td>
                  <td className="p-2 text-right text-xs font-bold text-amber-800">{formatETB(totalTransportCost)}</td>
                  <td className="p-2 text-right text-xs font-bold text-blue-800">{formatETB(totalLaborCost)}</td>
                  <td className="p-2 text-right text-sm font-bold text-blue-900">{formatETB(totalPurchasesCost)}</td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Page 3 Footer */}
          <div className="pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <span>StockERP Procurement Register • {filteredPurchases.length} Shipments</span>
            <span>ገጽ 3 ከ 4 • Page 3 of 4</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAGE 4: WAREHOUSE STOCK AUDIT & MANAGEMENT SIGN-OFF       */}
        {/* ========================================================= */}
        <div className="print-page-break space-y-4 pt-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                {language === "am" ? "ክፍል 3፡ የመጋዘን ክምችት ቆጠራ" : "PART 3: INVENTORY AUDIT & VALUATION"}
              </span>
              <h2 className="text-xl font-bold uppercase tracking-tight">
                {language === "am" ? "የመጋዘን አጠቃላይ የክምችት ቆጠራና የገንዘብ ግምት" : "Warehouse Stock Audit & Valuation"}
              </h2>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold">{formatEthDate(new Date())}</span>
              <p className="text-[10px] text-gray-500">Live Physical Balance</p>
            </div>
          </div>

          {/* Stock Table */}
          <table className="w-full text-xs text-left border border-gray-300">
            <thead className="bg-gray-100 border-b border-gray-300 font-semibold">
              <tr>
                <th className="p-1.5 w-8 text-center">#</th>
                <th className="p-1.5">{language === "am" ? "የእህል ስም" : "Commodity"}</th>
                <th className="p-1.5">{language === "am" ? "ምድብ" : "Category"}</th>
                <th className="p-1.5 text-right">{language === "am" ? "የተረፈ ክምችት" : "On Hand Stock"}</th>
                <th className="p-1.5 text-right">{language === "am" ? "የአንዱ ዋጋ" : "Unit Cost"}</th>
                <th className="p-1.5 text-right">{language === "am" ? "አጠቃላይ ግምት" : "Valuation (ETB)"}</th>
                <th className="p-1.5 text-center">{language === "am" ? "ሁኔታ" : "Status"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(allStockItems || []).map((item, idx) => {
                const qty = item.default_unit_factor === 1
                  ? item.current_stock_base_units
                  : item.current_stock_default_unit;
                return (
                  <tr key={item.product_id || idx}>
                    <td className="p-1.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-1.5 font-semibold">{item.product_name}</td>
                    <td className="p-1.5 text-gray-600">{tCategory(item.product_category)}</td>
                    <td className="p-1.5 text-right font-medium">
                      {formatQuantity(qty, item.default_unit_symbol)}
                    </td>
                    <td className="p-1.5 text-right">{formatETB(Number(item.base_cost_price) || 0)}</td>
                    <td className="p-1.5 text-right font-bold">
                      {formatETB(Number(item.current_valuation_etb) || 0)}
                    </td>
                    <td className="p-1.5 text-center text-[10px]">
                      {item.is_low_stock ? (
                        <span className="text-red-700 font-bold">{language === "am" ? "ዝቅተኛ" : "Low Stock"}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">{language === "am" ? "ጥሩ" : "Normal"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
              <tr>
                <td colSpan={5} className="p-2 text-right uppercase">
                  {language === "am" ? "ጠቅላላ የመጋዘን ክምችት ግምት ድምር (Total Valuation):" : "Total Inventory Valuation:"}
                </td>
                <td colSpan={2} className="p-2 text-right text-sm font-bold text-purple-900">
                  {formatETB(totalValuation)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Accounts Receivable Box */}
          <div className="print-avoid-break p-3 border border-amber-300 bg-amber-50/50 rounded flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-amber-950">
                {language === "am" ? "ክፍል 4፡ የደንበኞች ብድር አያያዝ" : "PART 4: ACCOUNTS RECEIVABLE STATUS"}
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {language === "am" ? "በዚህ ወቅት ውስጥ የተሰበሰበ እና ያልተሰበሰበ የደንበኞች ብድር ማጠቃለያ" : "Summary of active credit accounts and collections in period"}
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">{language === "am" ? "ያልተሰበሰበ ብድር" : "Outstanding Debt"}</span>
                <p className="font-bold text-red-700 text-sm">{formatETB(creditOutstanding)}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">{language === "am" ? "የተሰበሰበ ብድር" : "Collected in Period"}</span>
                <p className="font-bold text-emerald-700 text-sm">{formatETB(creditCollected)}</p>
              </div>
            </div>
          </div>

          {/* Official Sign-Off Block */}
          <div className="print-avoid-break pt-4 border-t-2 border-black mt-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3 text-gray-800">
              {language === "am" ? "ይፋዊ የሪፖርት ማረጋገጫና ፊርማ / Official Management Verification" : "Official Report Verification & Authorization"}
            </h4>
            <div className="grid grid-cols-3 gap-6 text-xs">
              <div className="border p-2.5 rounded bg-gray-50">
                <p className="font-semibold text-[11px]">{language === "am" ? "ያዘጋጀው ስራ አስኪያጅ" : "Prepared By"}:</p>
                <div className="mt-4 border-b border-gray-400 pb-1 font-mono text-[11px]">Manager</div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {language === "am" ? "ቀን" : "Date"}: {formatEthDate(new Date())}
                </p>
              </div>
              <div className="border p-2.5 rounded bg-gray-50">
                <p className="font-semibold text-[11px]">{language === "am" ? "ያረጋገጠው ኦዲተር" : "Audited / Checked By"}:</p>
                <div className="mt-4 border-b border-gray-400 pb-1 text-gray-400">________________________</div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {language === "am" ? "ቀን" : "Date"}: ________________________
                </p>
              </div>
              <div className="border p-2.5 rounded bg-gray-50 text-center flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-[11px]">{language === "am" ? "የንግድ ባለቤት ማህተም" : "Official Stamp / Seal"}:</p>
                </div>
                <div className="border-2 border-dashed border-gray-400 rounded py-3 my-1 text-[10px] text-gray-400 font-bold">
                  [ {language === "am" ? "ይፋዊ ማህተም" : "Official Seal"} ]
                </div>
                <p className="text-[9px] text-gray-500">Authorized Signature & Seal</p>
              </div>
            </div>
          </div>

          {/* Page 4 Footer */}
          <div className="pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <span>StockERP Audit & Stock Verification • End of Official Report</span>
            <span>ገጽ 4 ከ 4 • Page 4 of 4</span>
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

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
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
                <EthiopianDatePicker
                  value={customStart}
                  onChange={setCustomStart}
                />
              </div>

              <span className="text-muted-foreground text-xs hidden sm:inline">&rarr;</span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {t("reports_end_date")}:
                </span>
                <EthiopianDatePicker
                  value={customEnd}
                  onChange={setCustomEnd}
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
                <span className="text-amber-900 dark:text-amber-300 font-medium">{formatEthDate(activeStart)} &rarr; {formatEthDate(activeEnd)}</span>
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
              {(totalTransportCost > 0 || totalLaborCost > 0) && (
                <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>{language === "am" ? "የእቃዎች ዋጋ" : "Goods"}:</span>
                    <span className="font-semibold text-foreground">{formatETB(totalGoodsCost)}</span>
                  </div>
                  {totalTransportCost > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-400">
                      <span>🚚 {language === "am" ? "ትራንስፖርት" : "Transport"}:</span>
                      <span className="font-semibold">+{formatETB(totalTransportCost)}</span>
                    </div>
                  )}
                  {totalLaborCost > 0 && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-400">
                      <span>👷 {language === "am" ? "የማውረጃ (ኩሊ)" : "Labor"}:</span>
                      <span className="font-semibold">+{formatETB(totalLaborCost)}</span>
                    </div>
                  )}
                </div>
              )}
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
                      ({formatEthDate(activeStart)} &rarr; {formatEthDate(activeEnd)})
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
                      data={translatedCategoryValuation}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {translatedCategoryValuation.map((entry, index) => (
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
                {translatedCategoryValuation.map((cat) => (
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
                      : `Top-performing commodities between ${formatEthDate(activeStart)} and ${formatEthDate(activeEnd)}`}
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
                      : `Procurement expenses distributed across suppliers between ${formatEthDate(activeStart)} and ${formatEthDate(activeEnd)}`}
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
