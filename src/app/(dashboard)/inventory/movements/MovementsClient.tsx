"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  PackagePlus,
  ShoppingCart,
  Boxes,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatQuantity } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { StockMovement } from "@/types/database";

interface MovementsClientProps {
  initialMovements: StockMovement[];
  error: string | null;
}

export function MovementsClient({ initialMovements, error }: MovementsClientProps) {
  const { t, tCategory, formatEthDate, formatEthDateTime, isAmharic } = useLanguage();
  
  // Filter States
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "inbound" | "outbound">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMovementType, setSelectedMovementType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  // Metrics
  const metrics = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    let inboundGrams = 0;
    let outboundGrams = 0;

    initialMovements.forEach((m) => {
      const g = Number(m.quantity_base_units) || 0;
      if (g > 0) {
        inboundCount++;
        inboundGrams += g;
      } else {
        outboundCount++;
        outboundGrams += Math.abs(g);
      }
    });

    return {
      inboundCount,
      outboundCount,
      inboundGrams,
      outboundGrams,
    };
  }, [initialMovements]);

  // Unique Categories from actual movements
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    initialMovements.forEach((m) => {
      if (m.product?.category) {
        cats.add(m.product.category);
      }
    });
    return Array.from(cats);
  }, [initialMovements]);

  // Unique Movement Types
  const availableMovementTypes = useMemo(() => {
    const types = new Set<string>();
    initialMovements.forEach((m) => {
      if (m.movement_type) {
        types.add(m.movement_type);
      }
    });
    return Array.from(types);
  }, [initialMovements]);

  // Filter Movements
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return initialMovements.filter((m) => {
      const g = Number(m.quantity_base_units) || 0;
      const isInbound = g > 0;

      // 1. Inbound / Outbound
      if (filterType === "inbound" && !isInbound) return false;
      if (filterType === "outbound" && isInbound) return false;

      // 2. Category
      if (selectedCategory !== "all") {
        if (m.product?.category !== selectedCategory) return false;
      }

      // 3. Movement Type
      if (selectedMovementType !== "all") {
        if (m.movement_type !== selectedMovementType) return false;
      }

      // 4. Date Range
      if (dateRange !== "all") {
        const mDate = m.created_at ? m.created_at.slice(0, 10) : "";
        if (dateRange === "today") {
          if (mDate !== todayStr) return false;
        } else if (dateRange === "week") {
          const pastWeek = new Date(now);
          pastWeek.setDate(now.getDate() - 7);
          const weekStr = pastWeek.toISOString().split("T")[0];
          if (mDate < weekStr) return false;
        } else if (dateRange === "month") {
          const pastMonth = new Date(now);
          pastMonth.setDate(now.getDate() - 30);
          const monthStr = pastMonth.toISOString().split("T")[0];
          if (mDate < monthStr) return false;
        }
      }

      // 5. Deep Search
      if (search.trim()) {
        const prodName = (m.product?.name || "").toLowerCase();
        const prodCode = (m.product?.code || "").toLowerCase();
        const notes = (m.notes || "").toLowerCase();
        const reason = (m.override_reason || "").toLowerCase();
        const refId = (m.reference_id || "").toLowerCase();
        const mType = (m.movement_type || "").toLowerCase();
        const query = search.toLowerCase();

        const matches =
          prodName.includes(query) ||
          prodCode.includes(query) ||
          notes.includes(query) ||
          reason.includes(query) ||
          refId.includes(query) ||
          mType.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [initialMovements, search, filterType, selectedCategory, selectedMovementType, dateRange]);

  const hasActiveFilters =
    search.trim() !== "" ||
    filterType !== "all" ||
    selectedCategory !== "all" ||
    selectedMovementType !== "all" ||
    dateRange !== "all";

  function clearAllFilters() {
    setSearch("");
    setFilterType("all");
    setSelectedCategory("all");
    setSelectedMovementType("all");
    setDateRange("all");
  }

  function getMovementTypeLabel(type: string) {
    const tLower = (type || "").toLowerCase();
    if (tLower === "purchase") return isAmharic ? "የግዢ ገቢ" : "Purchase Delivery";
    if (tLower === "sale") return isAmharic ? "የሽያጭ ወጪ" : "POS Sale";
    if (tLower === "adjustment") return isAmharic ? "የክምችት ማስተካከያ" : "Physical Adjustment";
    if (tLower === "opening" || tLower === "initial") return isAmharic ? "የመክፈቻ ክምችት" : "Opening Stock";
    if (tLower === "return") return isAmharic ? "ተመላሽ" : "Customer Return";
    return type.replace(/_/g, " ");
  }

  function exportCSV() {
    const headers = [
      "Ethiopian Date",
      "Gregorian Date",
      "Type",
      "Product",
      "Category",
      "Quantity",
      "Unit",
      "Base Grams",
      "Reference",
      "Reason/Notes",
    ];
    const rows = filteredMovements.map((m) => [
      `"${formatEthDateTime(m.created_at)}"`,
      new Date(m.created_at).toLocaleString(),
      getMovementTypeLabel(m.movement_type),
      `"${m.product?.name || ""}"`,
      `"${tCategory(m.product?.category || "")}"`,
      m.original_quantity,
      m.unit?.symbol || "g",
      m.quantity_base_units,
      `"${m.reference_id || ""}"`,
      `"${m.notes || m.override_reason || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `stock_movements_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <ArrowLeftRight className="h-7 w-7 text-amber-600" />
            {t("nav_inbound_outbound")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAmharic
              ? "የሁሉንም እቃዎች ገቢና ወጪ እንቅስቃሴ የሚከታተል የተሟላ እና የማይሰረዝ የክምችት መዝገብ"
              : "Complete immutable audit trail of all stock received, sold, or physically adjusted."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-9 gap-1.5 border-emerald-600/30 text-foreground hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{t("reports_export_excel")}</span>
          </Button>

          <Link href="/purchases/new">
            <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
              <PackagePlus className="h-4 w-4" />
              <span>{t("btn_receive_new_stock")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/30 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("stock_inbound")} {isAmharic ? "እንቅስቃሴዎች" : "Events"}</span>
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {metrics.inboundCount} {isAmharic ? "እንቅስቃሴዎች" : "Movements"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "የተረከቧቸው ጭነቶች" : "Supplier deliveries received"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("mov_inbound_mass")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.inboundGrams > 0 ? metrics.inboundGrams.toLocaleString() : 0} {isAmharic ? "አሃዶች" : "Units"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "በተመዘገቡ መለኪያዎች" : "In registered units"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("stock_outbound")} {isAmharic ? "እንቅስቃሴዎች" : "Events"}</span>
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.outboundCount} {isAmharic ? "እንቅስቃሴዎች" : "Movements"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "ሽያጮች እና የፈሰሰ/የባከነ" : "Sales & spillage/wastage"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("mov_outbound_mass")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.outboundGrams > 0 ? metrics.outboundGrams.toLocaleString() : 0} {isAmharic ? "አሃዶች" : "Units"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "በተመዘገቡ መለኪያዎች" : "In registered units"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter and Search Controls */}
      <Card className="border shadow-xs bg-card/60 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Search and Inbound/Outbound Switcher */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  isAmharic
                    ? "በእህል ስም፣ ኮድ፣ ደረሰኝ ወይም ማስታወሻ ፈልግ..."
                    : "Search by commodity, code, invoice #, or notes..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Inbound / Outbound Direction Button Group */}
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 p-1">
              <Button
                variant={filterType === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-8 text-xs font-medium"
              >
                {t("btn_all")}
              </Button>
              <Button
                variant={filterType === "inbound" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("inbound")}
                className={`h-8 text-xs font-medium ${
                  filterType === "inbound"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />
                {t("stock_inbound")}
              </Button>
              <Button
                variant={filterType === "outbound" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("outbound")}
                className={`h-8 text-xs font-medium ${
                  filterType === "outbound"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-red-600"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                {t("stock_outbound")}
              </Button>
            </div>
          </div>

          {/* Row 2: Secondary Dropdown Filters (Category, Movement Type, Date Preset) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="font-medium text-[11px] uppercase tracking-wider">
                {isAmharic ? "ማጣሪያዎች:" : "Filters:"}
              </span>
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="all">
                {isAmharic ? "ሁሉም ምድቦች" : "All Categories"} ({availableCategories.length})
              </option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {tCategory(c)}
                </option>
              ))}
            </select>

            {/* Movement Type Dropdown */}
            <select
              value={selectedMovementType}
              onChange={(e) => setSelectedMovementType(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              <option value="all">
                {isAmharic ? "ሁሉም የዝውውር አይነቶች" : "All Movement Types"}
              </option>
              {availableMovementTypes.map((t) => (
                <option key={t} value={t}>
                  {getMovementTypeLabel(t)}
                </option>
              ))}
            </select>

            {/* Date Range Presets */}
            <div className="flex items-center gap-1">
              {[
                { id: "all", label: isAmharic ? "ሙሉ ታሪክ" : "All Time" },
                { id: "today", label: isAmharic ? "ዛሬ" : "Today" },
                { id: "week", label: isAmharic ? "ያለፉት 7 ቀናት" : "Past 7 Days" },
                { id: "month", label: isAmharic ? "ያለፉት 30 ቀናት" : "Past 30 Days" },
              ].map((p) => (
                <Badge
                  key={p.id}
                  variant="outline"
                  className={`cursor-pointer text-[11px] py-1 px-2 transition-all ${
                    dateRange === p.id
                      ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setDateRange(p.id as any)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 gap-1 ml-auto"
              >
                <X className="h-3.5 w-3.5" />
                <span>{isAmharic ? "ማጣሪያዎችን አጽዳ" : "Clear Filters"}</span>
              </Button>
            )}
          </div>

          {/* Row 3: Active Results Feedback Indicator */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>
              {isAmharic ? "የተገኙ ውጤቶች፡ " : "Showing "}
              <strong className="text-foreground">{filteredMovements.length}</strong>
              {isAmharic ? ` ከ ${initialMovements.length} እንቅስቃሴዎች` : ` of ${initialMovements.length} total stock events`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Audit Movements Table */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4 bg-muted/20">
          <CardTitle className="text-base font-semibold">{t("mov_table_title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("mov_table_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-5 py-3">{isAmharic ? "ቀንና ሰዓት (የኢትዮጵያ ዘመን አቆጣጠር)" : "Date & Time (Ethiopian Calendar)"}</th>
                  <th className="px-5 py-3">{isAmharic ? "እህል / ምርት" : "Commodity"}</th>
                  <th className="px-5 py-3 text-center">{t("mov_direction")}</th>
                  <th className="px-5 py-3 text-right">{t("common_quantity")}</th>
                  <th className="px-5 py-3">{isAmharic ? "የዝውውር አይነት" : "Transaction Type"}</th>
                  <th className="px-5 py-3">{t("purch_waybill_label")} / {t("credit_notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMovements.map((m) => {
                  const g = Number(m.quantity_base_units) || 0;
                  const isInbound = g > 0;

                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      {/* Ethiopian Date & Time */}
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>{formatEthDateTime(m.created_at)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                          {new Date(m.created_at).toISOString().split("T")[0]}
                        </div>
                      </td>

                      {/* Product Name & Category */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground text-sm">
                          {m.product?.name || (isAmharic ? "እህል" : "Commodity")}
                        </div>
                        {m.product?.category && (
                          <div className="text-[10px] text-muted-foreground">
                            {tCategory(m.product.category)} {m.product.code ? `• ${m.product.code}` : ""}
                          </div>
                        )}
                      </td>

                      {/* Inbound / Outbound Badge */}
                      <td className="px-5 py-3.5 text-center">
                        {isInbound ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <ArrowDownLeft className="h-3 w-3 text-emerald-600" /> {isAmharic ? "ገቢ" : "INBOUND"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                            <ArrowUpRight className="h-3 w-3 text-red-600" /> {isAmharic ? "ወጪ" : "OUTBOUND"}
                          </span>
                        )}
                      </td>

                      {/* Quantity in Unit and Grams */}
                      <td className="px-5 py-3.5 text-right font-bold text-sm">
                        <span className={isInbound ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {isInbound ? "+" : "-"}
                          {formatQuantity(Math.abs(m.original_quantity), m.unit?.symbol || "")}
                        </span>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          ({formatQuantity(Math.abs(g), "g")})
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          {getMovementTypeLabel(m.movement_type)}
                        </Badge>
                      </td>

                      {/* Notes / Reference */}
                      <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs">
                        {m.reference_id && (
                          <span className="font-mono text-[11px] text-foreground font-medium block">
                            #{m.reference_id}
                          </span>
                        )}
                        {m.notes && <span className="block truncate">{m.notes}</span>}
                        {m.manual_override && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">
                            {t("pos_override_badge")}: {m.override_reason || "Override"}
                          </span>
                        )}
                        {!m.reference_id && !m.notes && !m.manual_override && "—"}
                      </td>
                    </tr>
                  );
                })}
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          {isAmharic ? "ምንም የተገኘ የክምችት እንቅስቃሴ የለም" : "No stock movements match the selected filters."}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="mt-1 text-xs"
                          >
                            {isAmharic ? "ማጣሪያዎችን አጽዳ" : "Reset Filters"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
