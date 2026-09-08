"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tag,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  TrendingUp,
  Percent,
  Wheat,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatETB } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateProductPricesAction } from "@/app/actions/products";
import type { Product, Unit } from "@/types/database";

interface PricingClientProps {
  initialProducts: (Product & { default_unit?: Unit })[];
}

interface RowPriceState {
  costDisplay: number;
  sellDisplay: number;
  isDirty: boolean;
}

export function PricingClient({ initialProducts }: PricingClientProps) {
  const router = useRouter();
  const { t, isAmharic } = useLanguage();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Initialize editable prices map
  const [priceMap, setPriceMap] = useState<Record<string, RowPriceState>>(() => {
    const map: Record<string, RowPriceState> = {};
    initialProducts.forEach((p) => {
      const factor = p.default_unit?.conversion_factor || 1000;
      map[p.id] = {
        costDisplay: Number((p.cost_price_per_base_unit * factor).toFixed(2)),
        sellDisplay: Number((p.selling_price_per_base_unit * factor).toFixed(2)),
        isDirty: false,
      };
    });
    return map;
  });

  const filteredProducts = initialProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  function handlePriceChange(
    productId: string,
    field: "costDisplay" | "sellDisplay",
    value: number
  ) {
    setPriceMap((prev) => {
      const row = prev[productId] || { costDisplay: 0, sellDisplay: 0, isDirty: false };
      return {
        ...prev,
        [productId]: {
          ...row,
          [field]: value,
          isDirty: true,
        },
      };
    });
  }

  async function handleSaveRow(product: Product & { default_unit?: Unit }) {
    const row = priceMap[product.id];
    if (!row) return;

    setSavingId(product.id);
    setErrorNotice(null);
    setSuccessNotice(null);

    const factor = product.default_unit?.conversion_factor || 1000;
    const costPerGram = factor > 0 ? row.costDisplay / factor : 0;
    const sellPerGram = factor > 0 ? row.sellDisplay / factor : 0;

    const res = await updateProductPricesAction([
      {
        id: product.id,
        cost_price_per_base_unit: costPerGram,
        selling_price_per_base_unit: sellPerGram,
      },
    ]);

    if (res.success) {
      setPriceMap((prev) => ({
        ...prev,
        [product.id]: { ...row, isDirty: false },
      }));
      setSuccessNotice(`Prices updated successfully for ${product.name}!`);
      setTimeout(() => setSuccessNotice(null), 4000);
      router.refresh();
    } else {
      setErrorNotice(res.error || "Failed to update prices.");
    }
    setSavingId(null);
  }

  async function handleSaveAll() {
    setSavingAll(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    const updates = initialProducts
      .filter((p) => priceMap[p.id]?.isDirty)
      .map((p) => {
        const row = priceMap[p.id];
        const factor = p.default_unit?.conversion_factor || 1000;
        return {
          id: p.id,
          cost_price_per_base_unit: factor > 0 ? row.costDisplay / factor : 0,
          selling_price_per_base_unit: factor > 0 ? row.sellDisplay / factor : 0,
        };
      });

    if (updates.length === 0) {
      setSavingAll(false);
      return;
    }

    const res = await updateProductPricesAction(updates);
    if (res.success) {
      setPriceMap((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (next[u.id]) next[u.id].isDirty = false;
        });
        return next;
      });
      setSuccessNotice(`Updated prices for ${updates.length} commodities!`);
      setTimeout(() => setSuccessNotice(null), 4000);
      router.refresh();
    } else {
      setErrorNotice(res.error || "Failed to batch update prices.");
    }
    setSavingAll(false);
  }

  const dirtyCount = Object.values(priceMap).filter((r) => r.isDirty).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Tag className="h-7 w-7 text-amber-600" />
            {t("nav_pricing")} (Cost & Selling Prices)
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAmharic
              ? "የእህልና የዱቄት መግዣ እና መሸጫ ዋጋን በቀላሉ ማስተካከያ እና የትርፍ ህዳግ ማስያ"
              : "Rapidly adjust procurement cost and retail selling prices with real-time margin calculations."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <Button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm gap-1.5 text-xs font-semibold"
            >
              {savingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {t("btn_update_prices")} ({dirtyCount})
            </Button>
          )}
          <Link href="/products">
            <Button variant="outline" size="sm" className="text-xs">
              <Wheat className="mr-1.5 h-3.5 w-3.5" /> {t("nav_products")}
            </Button>
          </Link>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by commodity name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Price Management Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4 bg-muted/20">
          <CardTitle className="text-base font-semibold">
            Commodity Pricing Roster ({filteredProducts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Edit cost or selling price in the commodity's standard trade unit. Changes normalize to base grams automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-5 py-3">Commodity</th>
                  <th className="px-5 py-3">Trade Unit</th>
                  <th className="px-5 py-3 text-right">Cost Price (ETB)</th>
                  <th className="px-5 py-3 text-right">Selling Price (ETB)</th>
                  <th className="px-5 py-3 text-right">Gross Margin</th>
                  <th className="px-5 py-3 text-center">Margin %</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((p) => {
                  const unitSymbol = p.default_unit?.symbol || "kg";
                  const row = priceMap[p.id] || { costDisplay: 0, sellDisplay: 0, isDirty: false };
                  const marginEtb = Number((row.sellDisplay - row.costDisplay).toFixed(2));
                  const marginPct =
                    row.sellDisplay > 0
                      ? Number(((marginEtb / row.sellDisplay) * 100).toFixed(1))
                      : 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        row.isDirty ? "bg-amber-500/5 font-medium" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          {p.name}
                          {row.isDirty && (
                            <span className="h-2 w-2 rounded-full bg-amber-500" title="Unsaved changes" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.category} {p.code ? `&bull; ${p.code}` : ""}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {p.default_unit?.name || "Unit"} ({unitSymbol})
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.costDisplay}
                            onChange={(e) =>
                              handlePriceChange(
                                p.id,
                                "costDisplay",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 w-28 text-right font-mono text-xs"
                          />
                          <span className="text-[10px] text-muted-foreground w-6">/{unitSymbol}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.sellDisplay}
                            onChange={(e) =>
                              handlePriceChange(
                                p.id,
                                "sellDisplay",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 w-28 text-right font-mono text-xs font-bold text-amber-900 dark:text-amber-300"
                          />
                          <span className="text-[10px] text-muted-foreground w-6">/{unitSymbol}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-xs">
                        <span className={marginEtb >= 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-600 font-bold"}>
                          {marginEtb >= 0 ? "+" : ""}{formatETB(marginEtb)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant={marginPct >= 15 ? "success" : marginPct > 0 ? "warning" : "danger"}
                          className="text-[10px] font-mono"
                        >
                          {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          disabled={!row.isDirty || savingId === p.id}
                          onClick={() => handleSaveRow(p)}
                          className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:opacity-40"
                        >
                          {savingId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            t("btn_save")
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
