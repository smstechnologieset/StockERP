"use client";

import { useState } from "react";
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

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  productToEdit?: Product | null;
  onSuccess: () => void;
}

export function ProductFormModal({
  open,
  onOpenChange,
  units,
  productToEdit,
  onSuccess,
}: ProductFormModalProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  const defaultUnit = units.find((u) => u.is_base_unit) || units[0];

  // Default values calculation
  const initialDefaultUnitId = productToEdit?.default_unit_id || defaultUnit?.id || "";
  const selectedUnitObj = units.find((u) => u.id === initialDefaultUnitId) || defaultUnit;
  const initialFactor = selectedUnitObj?.conversion_factor || 1000;

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
      cost_price_display: productToEdit
        ? Number((productToEdit.cost_price_per_base_unit * initialFactor).toFixed(2))
        : 0,
      selling_price_display: productToEdit
        ? Number((productToEdit.selling_price_per_base_unit * initialFactor).toFixed(2))
        : 0,
      reorder_threshold_display: productToEdit
        ? Number((productToEdit.reorder_threshold_base_units / initialFactor).toFixed(2))
        : 5,
      is_active: productToEdit ? productToEdit.is_active : true,
    },
  });

  const selectedUnitId = watch("default_unit_id");
  const costPriceDisplay = watch("cost_price_display") || 0;
  const sellingPriceDisplay = watch("selling_price_display") || 0;
  const reorderDisplay = watch("reorder_threshold_display") || 0;

  const currentUnit = units.find((u) => u.id === selectedUnitId) || defaultUnit;
  const factor = currentUnit?.conversion_factor || 1;

  // Real-time unit conversion calculations
  const costPerGram = factor > 0 ? costPriceDisplay / factor : 0;
  const sellingPerGram = factor > 0 ? sellingPriceDisplay / factor : 0;
  const reorderThresholdGrams = reorderDisplay * factor;

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Convert display units to base units (grams) for storage
      const payload = {
        name: data.name,
        code: data.code || null,
        category: data.category,
        description: data.description || null,
        default_unit_id: data.default_unit_id,
        cost_price_per_base_unit: costPerGram,
        selling_price_per_base_unit: sellingPerGram,
        reorder_threshold_base_units: reorderThresholdGrams,
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

        {errorMessage && (
          <div className="mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("prod_name_label")}</Label>
              <Input
                id="name"
                placeholder={language === "am" ? "ምሳሌ፡ ልዩ የባሌ በርበሬ አንደኛ ደረጃ" : "e.g. Berbere Special Grade 1"}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code">{t("prod_code_label")}</Label>
              <Input
                id="code"
                placeholder={language === "am" ? "ምሳሌ፡ BER-001 ወይም WHT-Q" : "e.g. BER-001 or WHT-Q"}
                {...register("code")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">{t("prod_category_label")}</Label>
              <Select id="category" {...register("category")}>
                <option value="Whole Grains">{t("cat_whole_grains")}</option>
                <option value="Powders & Spices">{t("cat_powders_spices")}</option>
                <option value="Pulses / Legumes">{t("cat_pulses_legumes")}</option>
                <option value="Flour / Milling">{t("cat_flour_milling")}</option>
                <option value="Other">{t("cat_other")}</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default_unit_id">{t("prod_unit_label")}</Label>
              <Select id="default_unit_id" {...register("default_unit_id")}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol}) — {u.conversion_factor}{language === "am" ? "ግ" : "g"}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Pricing & Reorder Thresholds */}
          <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calculator className="h-3.5 w-3.5 text-amber-600" />
              <span>{t("prod_pricing_box_title")} ({currentUnit?.name || (language === "am" ? "መለኪያ" : "Unit")})</span>
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
                  {...register("reorder_threshold_display")}
                />
              </div>
            </div>

            {/* Live conversion breakdown for the user */}
            <div className="text-[11px] text-muted-foreground bg-background/80 p-2.5 rounded border space-y-1">
              <p>
                <strong className="text-foreground">{t("prod_base_math")}:</strong> 1 {currentUnit?.symbol} = {factor.toLocaleString()} {language === "am" ? "ግራም (g)" : "Grams (g)"}
              </p>
              <p>
                {t("prod_cost_label")}: <span className="font-mono text-foreground font-medium">{formatETB(costPerGram)}</span> / {language === "am" ? "ግ" : "g"} &bull; {t("prod_sell_label")}: <span className="font-mono text-foreground font-medium">{formatETB(sellingPerGram)}</span> / {language === "am" ? "ግ" : "g"}
              </p>
              <p>
                {t("prod_reorder_label")}: <span className="font-mono text-foreground font-medium">{reorderThresholdGrams.toLocaleString()} {language === "am" ? "ግራም" : "g"}</span>
              </p>
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
