"use client";

import Link from "next/link";
import { PackagePlus, Calendar, Building2, Receipt, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatETB } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PurchasesClientProps {
  purchases: any[];
}

export function PurchasesClient({ purchases }: PurchasesClientProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("purch_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("purch_subtitle")}
          </p>
        </div>

        <Link href="/purchases/new">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <PackagePlus className="h-4 w-4" /> {t("btn_receive_new_stock")}
          </Button>
        </Link>
      </div>

      {/* Purchases List */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">{t("purch_history_table")}</CardTitle>
          <CardDescription className="text-xs">
            {t("purch_history_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">{t("common_date")}</th>
                  <th className="px-6 py-3.5">{t("purch_waybill_label")}</th>
                  <th className="px-6 py-3.5">{t("sup_coop_badge")}</th>
                  <th className="px-6 py-3.5">{t("purch_line_items_title")}</th>
                  <th className="px-6 py-3.5 text-right">{t("common_total_cost")} ({t("currency_etb")})</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-amber-600" />
                        {purchase.invoice_reference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {purchase.supplier?.name || (t("common_status") === "ሁኔታ" ? "ያልታወቀ አቅራቢ" : "Unknown Supplier")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                      {purchase.items?.length > 0 ? (
                        <span>
                          {purchase.items
                            .map((i: any) => `${i.product?.name || "Item"} (${i.quantity}${i.unit?.symbol || ""})`)
                            .join(", ")}
                        </span>
                      ) : (
                        <span>{purchase.notes || t("common_items_count")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground font-mono">
                      {formatETB(purchase.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
