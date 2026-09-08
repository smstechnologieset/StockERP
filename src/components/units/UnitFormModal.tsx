"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, type UnitFormValues } from "@/lib/validations/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Scale } from "lucide-react";
import type { Unit } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UnitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitToEdit?: Unit | null;
  onSuccess: () => void;
}

export function UnitFormModal({
  open,
  onOpenChange,
  unitToEdit,
  onSuccess,
}: UnitFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();
  const { t, language } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: unitToEdit?.name || "",
      symbol: unitToEdit?.symbol || "",
      conversion_factor: unitToEdit?.conversion_factor || 1000,
    },
  });

  const unitName = watch("name") || (language === "am" ? "መለኪያ" : "Unit");
  const unitSymbol = watch("symbol") || (language === "am" ? "ምልክት" : "unit");
  const factor = watch("conversion_factor") || 0;

  async function onSubmit(data: UnitFormValues) {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (unitToEdit) {
        const { error } = await supabase
          .from("units")
          .update({
            name: data.name,
            symbol: data.symbol,
            conversion_factor: data.conversion_factor,
          })
          .eq("id", unitToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("units").insert({
          name: data.name,
          symbol: data.symbol,
          conversion_factor: data.conversion_factor,
          is_base_unit: false,
        });

        if (error) throw error;
      }

      onOpenChange(false);
      reset();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || (language === "am" ? "መለኪያውን ማስቀመጥ አልተቻለም።" : "Failed to save unit."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {unitToEdit ? t("unit_modal_edit_title") : t("unit_modal_add_title")}
          </DialogTitle>
          <DialogDescription>
            {t("unit_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("unit_name_label")}</Label>
            <Input
              id="name"
              placeholder={language === "am" ? "ምሳሌ፡ 500ግ ፓኬት፣ 25ኪ.ግ ጆንያ፣ ግማሽ ኩንታል" : "e.g. 500g Pouch, 25kg Sack, Half Quintal"}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="symbol">{t("unit_symbol_label")}</Label>
            <Input
              id="symbol"
              placeholder={language === "am" ? "ምሳሌ፡ pouch-500g, sack-25kg, h-q" : "e.g. pouch-500g, sack-25kg, h-q"}
              {...register("symbol")}
            />
            {errors.symbol && (
              <p className="text-[11px] text-red-600">{errors.symbol.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conversion_factor">
              {t("unit_factor_label")}
            </Label>
            <Input
              id="conversion_factor"
              type="number"
              step="any"
              placeholder={language === "am" ? "ምሳሌ፡ 500 ለ500ግ፣ 50000 ለ50ኪ.ግ ጆንያ" : "e.g. 500 for 500g pouch, 50000 for 50kg sack"}
              {...register("conversion_factor")}
            />
            {errors.conversion_factor && (
              <p className="text-[11px] text-red-600">
                {errors.conversion_factor.message}
              </p>
            )}
          </div>

          {/* Real-time Math Preview */}
          <div className="rounded-lg bg-muted/50 p-3 border flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Scale className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-foreground">
                1 {unitName} ({unitSymbol}) = {Number(factor).toLocaleString()} {language === "am" ? "ግራም (g)" : "Grams (g)"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {language === "am"
                  ? `በዚህ መለኪያ የሚመዘገብ ማንኛውም ሽያጭ ወይም ግዢ በክምችት መዝገቡ ላይ ወደ ${Number(factor).toLocaleString()} ግራም ይቀየራል።`
                  : `Every sale or purchase recorded in this unit will convert into ${Number(factor).toLocaleString()} grams in the stock ledger.`}
              </p>
            </div>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === "am" ? "በማስቀመጥ ላይ..." : "Saving..."}
                </>
              ) : unitToEdit ? (
                language === "am" ? "መለኪያ አዘምን" : "Update Unit"
              ) : (
                language === "am" ? "መለኪያ መዝግብ" : "Add Unit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
