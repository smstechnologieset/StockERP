"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  AlertTriangle,
  PackagePlus,
  ShoppingCart,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatETB, formatQuantity } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { recordStockAdjustmentAction } from "@/app/actions/inventory";
import type { ProductCurrentStockView, Unit } from "@/types/database";

interface InventoryClientProps {
  initialInventory: ProductCurrentStockView[];
  units: Unit[];
  initialFilter?: string;
}

export function InventoryClient({
  initialInventory,
  units,
  initialFilter,
}: InventoryClientProps) {
  const router = useRouter();
  const { t, isAmharic } = useLanguage();

  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(initialFilter === "low-stock");

  // Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCurrentStockView | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out">("out");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitId, setUnitId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalValuation = useMemo(() => {
    return initialInventory.reduce(
      (sum, item) => sum + (Number(item.current_valuation_etb) || 0),
      0
    );
  }, [initialInventory]);

  const lowStockCount = useMemo(() => {
    return initialInventory.filter((item) => item.is_low_stock).length;
  }, [initialInventory]);

  const filteredItems = useMemo(() => {
    return initialInventory.filter((item) => {
      const matchSearch =
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.product_code && item.product_code.toLowerCase().includes(search.toLowerCase())) ||
        item.product_category.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (filterLowStock && !item.is_low_stock) return false;

      return true;
    });
  }, [initialInventory, search, filterLowStock]);

  function openAdjustment(item: ProductCurrentStockView) {
    setSelectedProduct(item);
    setAdjustmentType("out");
    setQuantity(1);
    setUnitId(item.default_unit_id || units[0]?.id || "");
    setReason("Spillage / Wastage during storage");
    setErrorMsg(null);
    setAdjustModalOpen(true);
  }

  async function handleRecordAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!quantity || quantity <= 0) {
      setErrorMsg("Quantity must be greater than 0.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Reason is required for inventory audit integrity.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await recordStockAdjustmentAction({
      product_id: selectedProduct.product_id,
      adjustment_type: adjustmentType,
      quantity: quantity,
      unit_id: unitId || selectedProduct.default_unit_id || units[0]?.id || "",
      reason: reason,
    });

    if (res.success) {
      setAdjustModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to record adjustment.");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Boxes className="h-7 w-7 text-amber-600" />
            {t("nav_inventory")} & {t("nav_inventory_ledger")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAmharic
              ? "የእያንዳንዱ እህልና ዱቄት ትክክለኛ ክምችት በግራም ተሰልቶ የሚገኝበት ዋና የክምችት ሰሌዳ"
              : "Real-time on-hand stock derived from the append-only ledger, normalized to base grams."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/inventory/movements">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-amber-600/30">
              <ArrowLeftRight className="h-3.5 w-3.5 text-amber-600" />
              {t("nav_inbound_outbound")}
            </Button>
          </Link>
          <Link href="/purchases/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs">
              <PackagePlus className="mr-1 h-3.5 w-3.5" /> {t("btn_stock_in")}
            </Button>
          </Link>
          <Link href="/sales/new">
            <Button size="sm" variant="outline" className="text-xs">
              <ShoppingCart className="mr-1 h-3.5 w-3.5" /> {t("btn_new_sale")}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Commodities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {initialInventory.length} Products
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across Main Branch</p>
          </CardContent>
        </Card>

        <Card className="border-amber-600/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_current_valuation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {formatETB(totalValuation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-hand grams &times; cost price</p>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? "border-red-500/40 bg-red-50/20" : "border"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("stock_low_stock_warning")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockCount} Items
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("stock_reorder_needed")}</p>
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
                placeholder="Search inventory commodities or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filterLowStock ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterLowStock(!filterLowStock)}
                className="text-xs gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {filterLowStock ? "Show All Stock" : `${t("stock_low_stock_warning")} (${lowStockCount})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stock Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/20">
          <div>
            <CardTitle className="text-base font-semibold">Commodity Stock Ledger Balance</CardTitle>
            <CardDescription className="text-xs">
              Single source of truth: stock level is the mathematical sum of all movements in grams.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3">Commodity</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">On Hand (Display Unit)</th>
                  <th className="px-5 py-3 text-right">Base Units (Grams)</th>
                  <th className="px-5 py-3 text-right">Estimated Valuation</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.product_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-foreground text-sm">{item.product_name}</div>
                      {item.product_code && (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {item.product_code}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {item.product_category}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-sm text-foreground">
                      {formatQuantity(item.current_stock_default_unit, item.default_unit_symbol || "")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                      {formatQuantity(item.current_stock_base_units, "g")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                      {formatETB(item.current_valuation_etb)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
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
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustment(item)}
                          className="h-7 text-xs px-2"
                          title="Record physical recount, spillage, or wastage"
                        >
                          <SlidersHorizontal className="h-3 w-3 mr-1 text-amber-600" />
                          {t("btn_adjust_stock")}
                        </Button>
                        <Link href={`/purchases/new`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700">
                            + Stock-In
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* STOCK ADJUSTMENT MODAL */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="max-w-md" onClose={() => setAdjustModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-amber-600" />
              {t("stock_adjustment")}
            </DialogTitle>
            <DialogDescription>
              Record physical audit counts, spillage, wastage, moisture loss, or inventory corrections.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {errorMsg}
            </div>
          )}

          {selectedProduct && (
            <form onSubmit={handleRecordAdjustment} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commodity:</span>
                  <span className="font-semibold text-foreground">{selectedProduct.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-bold text-foreground">
                    {formatQuantity(selectedProduct.current_stock_default_unit, selectedProduct.default_unit_symbol || "")} ({formatQuantity(selectedProduct.current_stock_base_units, "g")})
                  </span>
                </div>
              </div>

              {/* Adjustment Direction */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Adjustment Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("out")}
                    className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      adjustmentType === "out"
                        ? "bg-red-50 text-red-700 border-red-500 font-bold dark:bg-red-950/40"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Minus className="h-4 w-4 text-red-600" />
                    <span>Reduce Stock (Wastage/Loss)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType("in")}
                    className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      adjustmentType === "in"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 font-bold dark:bg-emerald-950/40"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Plus className="h-4 w-4 text-emerald-600" />
                    <span>Add Stock (Found / Audit)</span>
                  </button>
                </div>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="adjQty" className="text-xs font-semibold">
                    Quantity *
                  </Label>
                  <Input
                    id="adjQty"
                    type="number"
                    step="any"
                    min="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="adjUnit" className="text-xs font-semibold">
                    Unit *
                  </Label>
                  <select
                    id="adjUnit"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason Presets */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Common Reason Presets</Label>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    t("stock_spillage"),
                    t("stock_recount"),
                    t("stock_damage"),
                    "Bag puncture in transit",
                    "Moisture / Dryness loss",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="px-2 py-0.5 rounded border bg-background text-muted-foreground hover:bg-muted text-[10px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-1">
                <Label htmlFor="adjReason" className="text-xs font-semibold">
                  {t("stock_reason")} *
                </Label>
                <Input
                  id="adjReason"
                  placeholder="Explain why inventory is being adjusted..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustModalOpen(false)}
                >
                  {t("btn_cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
                    </>
                  ) : (
                    "Apply Adjustment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
