"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { Supplier } from "@/types/database";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierToEdit?: Supplier | null;
  onSuccess: () => void;
}

export function SupplierFormModal({
  open,
  onOpenChange,
  supplierToEdit,
  onSuccess,
}: SupplierFormModalProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplierToEdit?.name || "",
      contact_person: supplierToEdit?.contact_person || "",
      phone: supplierToEdit?.phone || "",
      address: supplierToEdit?.address || "",
      notes: supplierToEdit?.notes || "",
      is_active: supplierToEdit ? supplierToEdit.is_active : true,
    },
  });

  async function onSubmit(data: SupplierFormValues) {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (supplierToEdit) {
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: data.name,
            contact_person: data.contact_person || null,
            phone: data.phone || null,
            address: data.address || null,
            notes: data.notes || null,
            is_active: data.is_active,
          })
          .eq("id", supplierToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert({
          name: data.name,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
          is_active: data.is_active,
        });

        if (error) throw error;
      }

      onOpenChange(false);
      reset();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || (language === "am" ? "አቅራቢውን ማስቀመጥ አልተቻለም።" : "Failed to save supplier."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {supplierToEdit ? t("sup_modal_edit_title") : t("sup_modal_add_title")}
          </DialogTitle>
          <DialogDescription>
            {t("sup_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("sup_name_label")}</Label>
            <Input
              id="name"
              placeholder={language === "am" ? "ምሳሌ፡ የኦሮሚያ እህል አብቃዮች ህብረት ስራ ማህበር፣ መርካቶ ቅመማ ቅመም" : "e.g. Oromia Grain Farmers Co-op, Merkato Spice Wholesalers"}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">{t("sup_contact_label")}</Label>
              <Input
                id="contact_person"
                placeholder={language === "am" ? "ምሳሌ፡ አቶ ግርማ ታደሰ" : "e.g. Ato Girma Tadesse"}
                {...register("contact_person")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("sup_phone_label")}</Label>
              <Input
                id="phone"
                placeholder="e.g. +251 911 234567"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">{t("sup_address_label")}</Label>
            <Input
              id="address"
              placeholder={language === "am" ? "ምሳሌ፡ አርሲ / ባሌ፣ ኦሮሚያ ወይም አዲስ አበባ መርካቶ" : "e.g. Arsi / Bale, Oromia, or Addis Merkato"}
              {...register("address")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("sup_notes_label")}</Label>
            <Textarea
              id="notes"
              placeholder={language === "am" ? "የሚያቀርቧቸው እህሎች (ስንዴ፣ በርበሬ...)፣ የክፍያ ሁኔታ..." : "Commodities supplied (e.g. Sinde Grade A, Pure Berbere chili), payment terms..."}
              {...register("notes")}
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
