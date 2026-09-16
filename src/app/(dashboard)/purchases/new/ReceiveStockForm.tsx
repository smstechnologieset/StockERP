"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PackagePlus,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Receipt,
  Scale,
  DollarSign,
  Loader2,
  CheckCircle2,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatETB, formatQuantity } from "@/lib/utils";
import { createPurchaseAction } from "@/app/actions/purchases";
import type { Product, Unit, Supplier } from "@/types/database";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { mergeWithStandardUnits } from "@/lib/constants/units";
import { EthiopianDatePicker } from "@/components/ui/EthiopianDatePicker";

interface LineItemRow {
  productId: string;
  unitId: string;
  quantity: number | string;
  unitCost: number | string;
}

interface ReceiveStockFormProps {
  products: Product[];
  units: Unit[];
  suppliers: Supplier[];
}

export function ReceiveStockForm({
  products,
  units: propUnits,
  suppliers,
}: ReceiveStockFormProps) {
  const router = useRouter();
  const { t, isAmharic, language } = useLanguage();
  const units = mergeWithStandardUnits(propUnits);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [transportCost, setTransportCost] = useState<string | number>("");
  const [laborCost, setLaborCost] = useState<string | number>("");
  const [updateCatalogCost, setUpdateCatalogCost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initial line items
  const defaultProduct = products[0];
  const defaultUnit =
    units.find((u) => u.id === defaultProduct?.default_unit_id) || units[0];

  const [items, setItems] = useState<LineItemRow[]>([
    {
      productId: defaultProduct?.id || "",
      unitId: defaultUnit?.id || "",
      quantity: 1,
      unitCost: defaultProduct
        ? Number(defaultProduct.cost_price_per_base_unit)
        : 100,
    },
  ]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct?.id || "",
        unitId: defaultUnit?.id || "",
        quantity: 1,
        unitCost: 100,
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItemRow, value: any) {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index], [field]: value };

      // If product changed, auto-suggest default unit and cost
      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        if (prod?.default_unit_id) {
          current.unitId = prod.default_unit_id;
        }
        if (prod && prod.cost_price_per_base_unit > 0) {
          current.unitCost = Number(prod.cost_price_per_base_unit);
        }
      }

      copy[index] = current;
      return copy;
    });
  }

  // Live Totals calculation
  let itemsSubtotal = 0;
  let totalQuantity = 0;

  items.forEach((item) => {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
    itemsSubtotal += lineTotal;
    totalQuantity += Number(item.quantity) || 0;
  });

  const numTransport = Number(transportCost) || 0;
  const numLabor = Number(laborCost) || 0;
  const grandTotalCost = itemsSubtotal + numTransport + numLabor;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      setErrorMessage(
        language === "am"
          ? "እባክዎ መጀመሪያ አቅራቢ ይምረጡ ወይም ይመዝግቡ።"
          : "Please select a supplier or create one first."
      );
      return;
    }
    if (items.length === 0) {
      setErrorMessage(
        language === "am"
          ? "እባክዎ ቢያንስ አንድ እህል ያስገቡ።"
          : "Please add at least one line item."
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload = {
      supplier_id: supplierId,
      purchase_date: purchaseDate,
      invoice_reference: invoiceRef || undefined,
      notes: notes || undefined,
      update_catalog_cost: updateCatalogCost,
      transport_cost: numTransport > 0 ? numTransport : undefined,
      labor_cost: numLabor > 0 ? numLabor : undefined,
      items: items.map((item) => {
        const u = units.find((x) => x.id === item.unitId);
        return {
          product_id: item.productId,
          unit_id: item.unitId,
          quantity: Number(item.quantity) || 0,
          unit_cost: Number(item.unitCost) || 0,
          conversion_factor: u?.conversion_factor || 1,
        };
      }),
    };

    const res = await createPurchaseAction(payload);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/inventory");
        router.refresh();
      }, 1200);
    } else {
      setErrorMessage(
        res.error ||
          (language === "am" ? "የእቃ ግዢውን መመዝገብ አልተቻለም።" : "Failed to record purchase.")
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("purch_receive_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("purch_receive_desc")}
          </p>
        </div>

        <Link href="/purchases">
          <Button variant="outline" size="sm">
            {t("btn_view_history")}
          </Button>
        </Link>
      </div>

      {/* Shipment Details Header Card */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base font-semibold">{t("sup_table_title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplierId">{t("purch_supplier_label")}</Label>
              {suppliers.length > 0 ? (
                <select
                  id="supplierId"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_person ? `(${s.contact_person})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-700">
                  {t("purch_select_supplier")}{" "}
                  <Link href="/suppliers" className="underline font-semibold">
                    {t("btn_add_supplier")}
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">{t("purch_date_label")}</Label>
              <EthiopianDatePicker
                id="purchaseDate"
                value={purchaseDate}
                onChange={setPurchaseDate}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoiceRef">{t("purch_waybill_label")}</Label>
              <Input
                id="invoiceRef"
                placeholder={language === "am" ? "ምሳሌ፡ WB-9921 ወይም ደረሰኝ-041" : "e.g. WB-9921 or REC-041"}
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Card */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle className="text-base font-semibold">{t("purch_line_items_title")}</CardTitle>
            <CardDescription className="text-xs">
              {t("unit_math_card_desc")}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-1 border-amber-600/30 text-amber-900 dark:text-amber-300"
          >
            <Plus className="h-3.5 w-3.5" /> {t("btn_add_line_item")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">{t("purch_commodity_col")}</th>
                  <th className="px-4 py-3 min-w-[140px]">{t("purch_unit_col")}</th>
                  <th className="px-4 py-3 w-32">{t("purch_qty_col")}</th>
                  <th className="px-4 py-3 w-36">{t("purch_unit_cost_col")}</th>
                  <th className="px-4 py-3 text-right min-w-[130px]">{t("purch_line_total_col")}</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => {
                  const selectedProd = products.find((p) => p.id === item.productId);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);

                  return (
                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                      {/* Product Selector */}
                      <td className="px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, "productId", e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                          required
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.code ? `(${p.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Unit Selector */}
                      <td className="px-4 py-3">
                        <select
                          value={item.unitId}
                          onChange={(e) => updateItem(index, "unitId", e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                          required
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.symbol})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="any"
                          min="0.001"
                          value={item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          className="h-9 text-xs"
                          required
                        />
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateItem(index, "unitCost", e.target.value)
                          }
                          className="h-9 text-xs"
                          required
                        />
                      </td>

                      {/* Line Total */}
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatETB(lineTotal)}
                      </td>

                      {/* Remove Button */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={items.length <= 1}
                          onClick={() => removeItem(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Optional Logistics & Offloading Expenses */}
          <div className="p-5 border-t bg-muted/10 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-foreground">
                {t("purch_additional_expenses")}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {language === "am" ? "አማራጭ" : "Optional"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transport Freight Cost */}
              <div className="space-y-1.5">
                <Label htmlFor="transportCost" className="text-xs flex items-center gap-1.5 font-medium">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("purch_transport_cost_label")}</span>
                </Label>
                <div className="relative">
                  <Input
                    id="transportCost"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="pr-12 text-sm font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    ETB
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("purch_transport_cost_desc")}
                </p>
              </div>

              {/* Offloading Labor Fee */}
              <div className="space-y-1.5">
                <Label htmlFor="laborCost" className="text-xs flex items-center gap-1.5 font-medium">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("purch_labor_cost_label")}</span>
                </Label>
                <div className="relative">
                  <Input
                    id="laborCost"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="pr-12 text-sm font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    ETB
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("purch_labor_cost_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Notes and Total Summary Footer */}
          <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="w-full sm:max-w-md space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("purch_notes_label")}</Label>
                <Input
                  id="notes"
                  placeholder={
                    language === "am"
                      ? "የእርጥበት ጥራት፣ የመኪና ታርጋ ቁጥር፣ የአሽከርካሪ ስም..."
                      : "Moisture quality, transport truck plate number, driver name..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Optional Catalog Default Cost Update Toggle */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-background hover:bg-muted/40 transition-colors cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={updateCatalogCost}
                  onChange={(e) => setUpdateCatalogCost(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500 shrink-0"
                />
                <div>
                  <span className="font-medium text-foreground block">
                    {language === "am"
                      ? "የእቃዎችን ነባሪ የመግዣ ዋጋ በነዚህ የደረሰኝ ዋጋዎች አዘምን"
                      : "Update master catalog default cost price with these purchase prices"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {language === "am"
                      ? "ካልተመረጠ ይህ ግዢ ለደረሰኝና ለክምችት ታሪክ ብቻ ይመዘገባል፣ የሱቁ መደበኛ የዋጋ ዝርዝር አይቀየርም።"
                      : "If unchecked, invoice prices are saved for this shipment without altering the shop's standard pricing policy."}
                  </span>
                </div>
              </label>
            </div>

            <div className="w-full sm:w-88 rounded-xl border bg-card p-4 space-y-2.5 shadow-xs">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("purch_items_count")}:</span>
                <span className="font-semibold text-foreground">
                  {items.length} {language === "am" ? "ረድፎች" : "Lines"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("common_quantity")}:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                  {totalQuantity} {language === "am" ? "አሃዶች" : "Units"}
                </span>
              </div>

              <div className="border-t pt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("purch_items_subtotal")}:</span>
                  <span className="font-mono font-medium text-foreground">{formatETB(itemsSubtotal)}</span>
                </div>
                {numTransport > 0 && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      <span>{language === "am" ? "ትራንስፖርት" : "Transport"}:</span>
                    </span>
                    <span className="font-mono font-semibold">+ {formatETB(numTransport)}</span>
                  </div>
                )}
                {numLabor > 0 && (
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{language === "am" ? "የማውረጃ ጉልበት (ኩሊ)" : "Offloading Labor"}:</span>
                    </span>
                    <span className="font-mono font-semibold">+ {formatETB(numLabor)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2.5 flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">{t("purch_total_shipment_cost")}:</span>
                <span className="text-xl text-amber-600 font-mono">{formatETB(grandTotalCost)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Status & Notifications (Instantly visible above action buttons) */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">
            {t("purch_stock_success_title")} {t("purch_stock_success_desc")}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading || success}
        >
          {t("btn_cancel")}
        </Button>
        <Button
          type="submit"
          disabled={loading || success}
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-[170px]"
        >
          {success ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-white" /> {language === "am" ? "ተመዝግቧል!" : "Recorded!"}
            </>
          ) : loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("btn_processing")}
            </>
          ) : (
            <>
              <PackagePlus className="mr-2 h-4 w-4" /> {t("btn_record_receipt")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
