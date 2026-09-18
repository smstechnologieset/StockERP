"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatETB } from "@/lib/utils";
import { Loader2, Calculator, Package } from "lucide-react";
import type { Unit, Product } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { saveProductWithStockAction } from "@/app/actions/products";
import { mergeWithStandardUnits } from "@/lib/constants/units";

export type ProductWithStock = Product & {
  default_unit?: Unit;
  current_stock_default_unit?: number;
  current_stock_base_units?: number;
  is_low_stock?: boolean;
};

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  productToEdit?: ProductWithStock | null;
  onSuccess: (savedProduct: ProductWithStock, isNew: boolean) => void;
}

export function ProductFormModal({
  open,
  onOpenChange,
  units,
  productToEdit,
  onSuccess,
}: ProductFormModalProps) {
  const { t, tCategory, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableUnits = mergeWithStandardUnits(units);

  const defaultUnit = availableUnits.find((u) => u.symbol === "kg") || availableUnits[0];
  const initialDefaultUnitId = productToEdit?.default_unit_id || defaultUnit?.id || "";

  const currentRecordedStock = productToEdit?.current_stock_default_unit !== undefined
    ? Number(productToEdit.current_stock_default_unit)
    : 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: productToEdit?.name || "",
      code: productToEdit?.code || "",
      category: productToEdit?.category || "Whole Grains",
      description: productToEdit?.description || "",
      default_unit_id: initialDefaultUnitId,
      cost_price_display: 0,
      selling_price_display: 0,
      reorder_threshold_display: 5,
      initial_stock_display: 0,
      current_stock_display: currentRecordedStock,
      stock_adjustment_reason: "",
      is_active: true,
    },
  });

  // Re-populate form with existing product values whenever productToEdit or open changes
  useEffect(() => {
    if (open) {
      if (productToEdit) {
        const unit = availableUnits.find((u) => u.id === productToEdit.default_unit_id) || productToEdit.default_unit || defaultUnit;
        const factor = unit?.conversion_factor || 1;
        const costDisplay = factor === 1
          ? Number(productToEdit.cost_price_per_base_unit)
          : Number((Number(productToEdit.cost_price_per_base_unit) * factor).toFixed(2));
        const sellDisplay = factor === 1
          ? Number(productToEdit.selling_price_per_base_unit)
          : Number((Number(productToEdit.selling_price_per_base_unit) * factor).toFixed(2));
        const reorderDisplay = factor === 1
          ? Number(productToEdit.reorder_threshold_base_units)
          : Number((Number(productToEdit.reorder_threshold_base_units) / factor).toFixed(2));
        const recordedStock = productToEdit.current_stock_default_unit !== undefined
          ? Number(productToEdit.current_stock_default_unit)
          : 0;

        reset({
          name: productToEdit.name || "",
          code: productToEdit.code || "",
          category: productToEdit.category || "Whole Grains",
          description: productToEdit.description || "",
          default_unit_id: productToEdit.default_unit_id || defaultUnit?.id || "",
          cost_price_display: isNaN(costDisplay) ? 0 : costDisplay,
          selling_price_display: isNaN(sellDisplay) ? 0 : sellDisplay,
          reorder_threshold_display: isNaN(reorderDisplay) ? 5 : reorderDisplay,
          initial_stock_display: 0,
          current_stock_display: recordedStock,
          stock_adjustment_reason: "",
          is_active: productToEdit.is_active ?? true,
        });
      } else {
        reset({
          name: "",
          code: "",
          category: "Whole Grains",
          description: "",
          default_unit_id: defaultUnit?.id || "",
          cost_price_display: 0,
          selling_price_display: 0,
          reorder_threshold_display: 5,
          initial_stock_display: 0,
          current_stock_display: 0,
          stock_adjustment_reason: "",
          is_active: true,
        });
      }
      setErrorMessage(null);
    }
  }, [open, productToEdit, reset, defaultUnit]);

  const selectedUnitId = watch("default_unit_id");
  const costPriceDisplay = Number(watch("cost_price_display")) || 0;
  const sellingPriceDisplay = Number(watch("selling_price_display")) || 0;
  const currentStockFormVal = watch("current_stock_display");
  const parsedTargetStock =
    currentStockFormVal !== undefined && !isNaN(Number(currentStockFormVal))
      ? Number(currentStockFormVal)
      : currentRecordedStock;
  const stockDelta = Number((parsedTargetStock - currentRecordedStock).toFixed(3));

  const currentUnit = availableUnits.find((u) => u.id === selectedUnitId) || defaultUnit;

  // Margin preview
  const unitMargin = sellingPriceDisplay - costPriceDisplay;
  const unitMarginPct = sellingPriceDisplay > 0 ? (unitMargin / sellingPriceDisplay) * 100 : 0;

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    setErrorMessage(null);

    try {
      const unit = availableUnits.find((u) => u.id === data.default_unit_id) || defaultUnit;
      const factor = unit?.conversion_factor || 1;
      const costBase = factor === 1 ? data.cost_price_display : (factor > 0 ? data.cost_price_display / factor : 0);
      const sellBase = factor === 1 ? data.selling_price_display : (factor > 0 ? data.selling_price_display / factor : 0);
      const reorderBase = factor === 1 ? data.reorder_threshold_display : (factor > 0 ? data.reorder_threshold_display * factor : 0);

      const isNew = !productToEdit;

      const res = await saveProductWithStockAction({
        id: productToEdit?.id,
        name: data.name,
        code: data.code || null,
        category: data.category,
        description: data.description || null,
        default_unit_id: data.default_unit_id,
        cost_price_per_base_unit: costBase,
        selling_price_per_base_unit: sellBase,
        reorder_threshold_base_units: reorderBase,
        is_active: data.is_active,
        initial_stock: isNew ? Number(data.initial_stock_display) || 0 : undefined,
        current_stock: !isNew ? currentRecordedStock : undefined,
        target_stock: !isNew ? parsedTargetStock : undefined,
        adjustment_reason: data.stock_adjustment_reason || undefined,
      });

      if (!res.success || !res.product) {
        throw new Error(res.error || "Failed to save product.");
      }

      onOpenChange(false);
      reset();
      onSuccess(res.product as ProductWithStock, isNew);
    } catch (err: any) {
      setErrorMessage(err.message || (language === "am" ? "ምርቱን ማስቀመጥ አልተቻለም።" : "Failed to save product."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? t("prod_modal_edit_title") : t("prod_modal_add_title")}
          </DialogTitle>
          <DialogDescription>
            {t("prod_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("prod_name_label")}</Label>
            <Input
              id="name"
              placeholder={language === "am" ? "ምሳሌ፡ የምግብ ዘይት 5L ወይም ልዩ በርበሬ" : "e.g. Cooking Oil 5L or Berbere Special"}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">{t("prod_category_label")}</Label>
              <Select id="category" {...register("category")}>
                <option value="Whole Grains">{tCategory("Whole Grains")}</option>
                <option value="Powders & Spices">{tCategory("Powders & Spices")}</option>
                <option value="Edible Oils & Liquids">{tCategory("Edible Oils & Liquids")}</option>
                <option value="Packaged Goods & Provisions">{tCategory("Packaged Goods & Provisions")}</option>
                <option value="Pulses / Legumes">{tCategory("Pulses / Legumes")}</option>
                <option value="Flour / Milling">{tCategory("Flour / Milling")}</option>
                <option value="Other">{tCategory("Other")}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default_unit_id">{t("prod_unit_label")}</Label>
              <Select id="default_unit_id" {...register("default_unit_id")}>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Initial Stock Input for New Product */}
          {!productToEdit && (
            <div className="p-3.5 bg-amber-500/5 rounded-lg border border-amber-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="initial_stock_display" className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Package className="h-4 w-4 text-amber-600" />
                  {t("prod_initial_stock_label")} ({currentUnit?.name || currentUnit?.symbol})
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {language === "am" ? "አማራጭ (ከሌለ 0 ያድርጉት)" : "Optional (0 if none)"}
                </span>
              </div>
              <div className="relative">
                <Input
                  id="initial_stock_display"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  {...register("initial_stock_display")}
                  className="font-medium pr-14"
                />
                <div className="absolute right-3 top-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400 pointer-events-none">
                  {currentUnit?.symbol}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("prod_initial_stock_hint")}
              </p>
            </div>
          )}

          {/* Current Stock and Stock Adjustment for Existing Product */}
          {productToEdit && (
            <div className="p-3.5 bg-amber-500/5 rounded-lg border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-foreground">
                    {t("prod_current_stock_label")}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                  {currentRecordedStock} {currentUnit?.symbol}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div className="space-y-1">
                  <Label htmlFor="current_stock_display" className="text-xs font-medium">
                    {t("prod_edit_stock_label")} ({currentUnit?.symbol})
                  </Label>
                  <Input
                    id="current_stock_display"
                    type="number"
                    step="any"
                    min="0"
                    onFocus={(e) => e.target.select()}
                    {...register("current_stock_display")}
                    className="font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="stock_adjustment_reason" className="text-xs font-medium">
                    {t("prod_stock_reason_label")}
                  </Label>
                  <Input
                    id="stock_adjustment_reason"
                    placeholder={t("prod_stock_reason_placeholder")}
                    {...register("stock_adjustment_reason")}
                    className="text-xs"
                  />
                </div>
              </div>

              {Math.abs(stockDelta) > 0.0001 && (
                <div
                  className={`text-xs px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between ${
                    stockDelta > 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                  }`}
                >
                  <span>
                    {language === "am" ? "የሚደረግ ማስተካከያ፦" : "Stock Adjustment:"}{" "}
                    <strong>{stockDelta > 0 ? `+${stockDelta}` : stockDelta} {currentUnit?.symbol}</strong>
                  </span>
                  <span className="text-[11px] font-normal">
                    {stockDelta > 0
                      ? (language === "am" ? "ወደ መጋዘን ይጨመራል" : "will be added to stock")
                      : (language === "am" ? "ከመጋዘን ይቀነሳል" : "will be deducted from stock")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pricing & Reorder Thresholds */}
          <div className="p-3.5 bg-muted/40 rounded-lg border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  {t("prod_pricing_box_title")} ({currentUnit?.name || currentUnit?.symbol})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sellingPriceDisplay > 0 && (
                  <span className={`text-[11px] font-bold ${unitMargin >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>
                    {t("pricing_gross_margin")}: {formatETB(unitMargin)} ({unitMarginPct.toFixed(1)}%)
                  </span>
                )}
                {productToEdit && (
                  <Link
                    href={`/products/pricing?search=${encodeURIComponent(productToEdit.name)}`}
                    className="text-[11px] text-amber-600 hover:underline font-semibold ml-1 inline-flex items-center gap-1"
                    onClick={() => onOpenChange(false)}
                  >
                    {language === "am" ? "የዋጋ ማዕከል ክፈት →" : "Fast Price Manager →"}
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cost_price_display" className="text-xs">
                  {t("prod_cost_label")} ({t("currency_etb")} / {currentUnit?.symbol})
                </Label>
                <Input
                  id="cost_price_display"
                  type="number"
                  step="0.01"
                  onFocus={(e) => e.target.select()}
                  {...register("cost_price_display")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="selling_price_display" className="text-xs">
                  {t("prod_sell_label")} ({t("currency_etb")} / {currentUnit?.symbol})
                </Label>
                <Input
                  id="selling_price_display"
                  type="number"
                  step="0.01"
                  onFocus={(e) => e.target.select()}
                  {...register("selling_price_display")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reorder_threshold_display" className="text-xs">
                  {t("prod_reorder_label")} ({currentUnit?.symbol})
                </Label>
                <Input
                  id="reorder_threshold_display"
                  type="number"
                  step="0.1"
                  onFocus={(e) => e.target.select()}
                  {...register("reorder_threshold_display")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t("prod_desc_label")}</Label>
            <Textarea
              id="description"
              placeholder={language === "am" ? "የመጣበት ቦታ፣ የጥራት ደረጃ፣ የማሸጊያ ዝርዝር..." : "Origin, quality grade, packaging specifications..."}
              {...register("description")}
            />
          </div>

          {errorMessage && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              {errorMessage}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("btn_cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("btn_processing")}
                </>
              ) : (
                t("btn_save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
