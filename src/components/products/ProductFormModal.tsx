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
import { createClient } from "@/lib/supabase/client";
import { formatETB } from "@/lib/utils";
import { Loader2, Calculator } from "lucide-react";
import type { Unit, Product } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

import { mergeWithStandardUnits } from "@/lib/constants/units";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  productToEdit?: (Product & { default_unit?: Unit }) | null;
  onSuccess: () => void;
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
  const supabase = createClient();

  const availableUnits = mergeWithStandardUnits(units);

  const defaultUnit = availableUnits.find((u) => u.symbol === "kg") || availableUnits[0];
  const initialDefaultUnitId = productToEdit?.default_unit_id || defaultUnit?.id || "";

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

        reset({
          name: productToEdit.name || "",
          code: productToEdit.code || "",
          category: productToEdit.category || "Whole Grains",
          description: productToEdit.description || "",
          default_unit_id: productToEdit.default_unit_id || defaultUnit?.id || "",
          cost_price_display: isNaN(costDisplay) ? 0 : costDisplay,
          selling_price_display: isNaN(sellDisplay) ? 0 : sellDisplay,
          reorder_threshold_display: isNaN(reorderDisplay) ? 5 : reorderDisplay,
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
          is_active: true,
        });
      }
      setErrorMessage(null);
    }
  }, [open, productToEdit, reset, defaultUnit]);

  const selectedUnitId = watch("default_unit_id");
  const costPriceDisplay = Number(watch("cost_price_display")) || 0;
  const sellingPriceDisplay = Number(watch("selling_price_display")) || 0;
  const reorderDisplay = Number(watch("reorder_threshold_display")) || 0;

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

      const payload = {
        name: data.name,
        code: data.code || null,
        category: data.category,
        description: data.description || null,
        default_unit_id: data.default_unit_id,
        cost_price_per_base_unit: costBase,
        selling_price_per_base_unit: sellBase,
        reorder_threshold_base_units: reorderBase,
        is_active: data.is_active,
      };

      if (productToEdit) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }

      onOpenChange(false);
      reset();
      onSuccess();
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
