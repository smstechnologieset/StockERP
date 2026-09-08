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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatETB, formatQuantity } from "@/lib/utils";
import { createPurchaseAction } from "@/app/actions/purchases";
import type { Product, Unit, Supplier } from "@/types/database";
import Link from "next/link";

interface LineItemRow {
  productId: string;
  unitId: string;
  quantity: number;
  unitCost: number;
}

interface ReceiveStockFormProps {
  products: Product[];
  units: Unit[];
  suppliers: Supplier[];
}

export function ReceiveStockForm({
  products,
  units,
  suppliers,
}: ReceiveStockFormProps) {
  const router = useRouter();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
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
        ? Number((defaultProduct.cost_price_per_base_unit * (defaultUnit?.conversion_factor || 1000)).toFixed(2))
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

      // If product changed, auto-suggest default unit
      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        if (prod?.default_unit_id) {
          current.unitId = prod.default_unit_id;
          const u = units.find((x) => x.id === prod.default_unit_id);
          if (u && prod.cost_price_per_base_unit > 0) {
            current.unitCost = Number((prod.cost_price_per_base_unit * u.conversion_factor).toFixed(2));
          }
        }
      }

      // If unit changed, adjust suggested unit cost
      if (field === "unitId") {
        const prod = products.find((p) => p.id === current.productId);
        const u = units.find((x) => x.id === value);
        if (prod && u && prod.cost_price_per_base_unit > 0) {
          current.unitCost = Number((prod.cost_price_per_base_unit * u.conversion_factor).toFixed(2));
        }
      }

      copy[index] = current;
      return copy;
    });
  }

  // Live Totals calculation
  let totalCost = 0;
  let totalGrams = 0;

  items.forEach((item) => {
    const lineTotal = (item.quantity || 0) * (item.unitCost || 0);
    totalCost += lineTotal;
    const u = units.find((x) => x.id === item.unitId);
    const factor = u?.conversion_factor || 1;
    totalGrams += (item.quantity || 0) * factor;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      setErrorMessage("Please select a supplier or create one first.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Please add at least one line item.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload = {
      supplier_id: supplierId,
      purchase_date: purchaseDate,
      invoice_reference: invoiceRef || undefined,
      notes: notes || undefined,
      items: items.map((item) => {
        const u = units.find((x) => x.id === item.unitId);
        return {
          product_id: item.productId,
          unit_id: item.unitId,
          quantity: Number(item.quantity),
          unit_cost: Number(item.unitCost),
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
      setErrorMessage(res.error || "Failed to record purchase.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Receive Stock (Purchases)
          </h1>
          <p className="text-sm text-muted-foreground">
            Log incoming grain shipments from farmers or wholesalers. Automatically updates inventory ledger in base grams.
          </p>
        </div>

        <Link href="/purchases">
          <Button variant="outline" size="sm">
            View Past Shipments
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>
            Stock receipt recorded successfully! Immutable stock ledger updated. Redirecting to inventory...
          </span>
        </div>
      )}

      {/* Shipment Details Header Card */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base font-semibold">Vendor & Shipment Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="supplierId">Supplier / Farmer *</Label>
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
                  No suppliers found.{" "}
                  <Link href="/suppliers" className="underline font-semibold">
                    Add a supplier first
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Arrival / Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoiceRef">Supplier Invoice / Waybill No.</Label>
              <Input
                id="invoiceRef"
                placeholder="e.g. WB-9921 or REC-041"
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
            <CardTitle className="text-base font-semibold">Commodity Line Items</CardTitle>
            <CardDescription className="text-xs">
              Quantities entered in Quintals or Kg automatically convert to storage base units (grams).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-1 border-amber-600/30 text-amber-900 dark:text-amber-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item Row
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Product / Commodity</th>
                  <th className="px-4 py-3 min-w-[140px]">Unit</th>
                  <th className="px-4 py-3 w-32">Quantity</th>
                  <th className="px-4 py-3 w-36">Unit Cost (ETB)</th>
                  <th className="px-4 py-3 text-right min-w-[140px]">Base Units (g)</th>
                  <th className="px-4 py-3 text-right min-w-[130px]">Line Total</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => {
                  const selectedProd = products.find((p) => p.id === item.productId);
                  const selectedU = units.find((u) => u.id === item.unitId);
                  const factor = selectedU?.conversion_factor || 1;
                  const rowGrams = (item.quantity || 0) * factor;
                  const lineTotal = (item.quantity || 0) * (item.unitCost || 0);

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
                          onChange={(e) =>
                            updateItem(index, "quantity", parseFloat(e.target.value) || 0)
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
                          onChange={(e) =>
                            updateItem(index, "unitCost", parseFloat(e.target.value) || 0)
                          }
                          className="h-9 text-xs"
                          required
                        />
                      </td>

                      {/* Base Unit Grams calculation */}
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {formatQuantity(rowGrams, "g")}
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

          {/* Notes and Total Summary Footer */}
          <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="w-full sm:max-w-md space-y-1.5">
              <Label htmlFor="notes">Shipment Notes / Batch Remarks</Label>
              <Input
                id="notes"
                placeholder="Moisture quality, transport truck plate number, driver name..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-80 rounded-xl border bg-card p-4 space-y-2 shadow-xs">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Items:</span>
                <span className="font-semibold text-foreground">{items.length} Lines</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Incoming Weight:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                  {formatQuantity(totalGrams, "g")}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-foreground">Total Shipment Cost:</span>
                <span className="text-lg text-amber-600">{formatETB(totalCost)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording Stock...
            </>
          ) : (
            <>
              <PackagePlus className="mr-2 h-4 w-4" /> Complete Stock-In
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
