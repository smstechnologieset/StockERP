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
  const { t, isAmharic } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "inbound" | "outbound">("all");

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

  const filteredMovements = useMemo(() => {
    return initialMovements.filter((m) => {
      const g = Number(m.quantity_base_units) || 0;
      const isInbound = g > 0;

      if (filterType === "inbound" && !isInbound) return false;
      if (filterType === "outbound" && isInbound) return false;

      const prodName = m.product?.name || "";
      const prodCode = m.product?.code || "";
      const notes = m.notes || "";
      const reason = m.override_reason || "";
      const query = search.toLowerCase();

      return (
        prodName.toLowerCase().includes(query) ||
        prodCode.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query) ||
        reason.toLowerCase().includes(query)
      );
    });
  }, [initialMovements, search, filterType]);

  function exportCSV() {
    const headers = ["Date", "Type", "Product", "Category", "Quantity", "Unit", "Base Grams", "Reason/Notes"];
    const rows = filteredMovements.map((m) => [
      new Date(m.created_at).toLocaleString(),
      m.movement_type,
      `"${m.product?.name || ""}"`,
      `"${m.product?.category || ""}"`,
      m.original_quantity,
      m.unit?.symbol || "g",
      m.quantity_base_units,
      `"${m.notes || m.override_reason || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_movements_${new Date().toISOString().split("T")[0]}.csv`);
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

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            {t("btn_export_csv")}
          </Button>
          <Link href="/purchases/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs">
              <PackagePlus className="mr-1 h-3.5 w-3.5" /> {t("btn_stock_in")}
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-600/30 bg-emerald-50/10 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("stock_inbound")} {isAmharic ? "እንቅስቃሴዎች" : "Events"}</span>
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {metrics.inboundCount} {isAmharic ? "እንቅስቃሴዎች" : "Movements"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "ግዢዎች እና የተጨመሩ እቃዎች" : "Purchases & positive adjustments"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-600/30 bg-card">
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

        <Card className="border-red-500/30 bg-red-50/10 dark:bg-red-950/10">
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

      {/* Filter and Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAmharic ? "በእህል ስም፣ ኮድ፣ ደረሰኝ ወይም ማስታወሻ ፈልግ..." : "Search by commodity, code, invoice #, or note..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-8 text-xs"
              >
                {t("btn_all")}
              </Button>
              <Button
                variant={filterType === "inbound" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("inbound")}
                className="h-8 text-xs text-emerald-700 dark:text-emerald-400"
              >
                {t("stock_inbound")}
              </Button>
              <Button
                variant={filterType === "outbound" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("outbound")}
                className="h-8 text-xs text-red-600"
              >
                {t("stock_outbound")}
              </Button>
            </div>
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
                  <th className="px-5 py-3">{t("mov_timestamp")}</th>
                  <th className="px-5 py-3">{isAmharic ? "እህል / ምርት" : "Commodity"}</th>
                  <th className="px-5 py-3 text-center">{t("mov_direction")}</th>
                  <th className="px-5 py-3 text-right">{t("common_quantity")}</th>
                  <th className="px-5 py-3">{t("mov_type_ref")}</th>
                  <th className="px-5 py-3">{t("mov_audit_notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMovements.map((m) => {
                  const g = Number(m.quantity_base_units) || 0;
                  const isInbound = g > 0;

                  return (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground text-sm">
                          {m.product?.name || (isAmharic ? "እህል" : "Commodity")}
                        </div>
                        {m.product?.category && (
                          <div className="text-[10px] text-muted-foreground">
                            {m.product.category}
                          </div>
                        )}
                      </td>

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

                      <td className="px-5 py-3.5 text-right font-bold text-sm">
                        <span className={isInbound ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                          {isInbound ? "+" : "-"}
                          {formatQuantity(Math.abs(m.original_quantity), m.unit?.symbol || "")}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {m.movement_type.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate">
                        {m.override_reason || m.notes || (isAmharic ? "የተለመደ የክምችት ዝውውር" : "Standard ledger transaction")}
                      </td>
                    </tr>
                  );
                })}

                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-muted-foreground">
                      {isAmharic ? "ምንም የእቃ እንቅስቃሴ አልተገኘም።" : "No stock movements found."}
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
