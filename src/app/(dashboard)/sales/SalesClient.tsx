"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Calendar,
  User,
  Phone,
  Receipt,
  Smartphone,
  Banknote,
  Building,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatETB } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SalesClientProps {
  sales: any[];
  totalSalesRevenue: number;
}

export function SalesClient({ sales, totalSalesRevenue }: SalesClientProps) {
  const { t, isAmharic } = useLanguage();

  function getPaymentBadge(method: string) {
    switch (method) {
      case "telebirr":
        return (
          <Badge variant="info" className="gap-1 text-[10px]">
            <Smartphone className="h-3 w-3" /> {t("pay_telebirr")}
          </Badge>
        );
      case "cbe_birr":
        return (
          <Badge variant="info" className="gap-1 text-[10px]">
            <Smartphone className="h-3 w-3" /> {t("pay_cbe_birr")}
          </Badge>
        );
      case "bank_transfer":
        return (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Building className="h-3 w-3" /> {t("pay_bank_transfer")}
          </Badge>
        );
      case "credit":
        return (
          <Badge variant="warning" className="gap-1 text-[10px]">
            <CreditCard className="h-3 w-3" /> {t("pay_credit")}
          </Badge>
        );
      default:
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <Banknote className="h-3 w-3" /> {t("pay_cash")}
          </Badge>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("pos_sales_history_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pos_sales_history_desc")}
          </p>
        </div>

        <Link href="/sales/new">
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <ShoppingCart className="h-4 w-4" /> {t("btn_open_pos")}
          </Button>
        </Link>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pos_total_invoices")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-foreground">
              {sales.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pos_settled_full")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-600/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pos_total_revenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-300">
              {formatETB(totalSalesRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("common_all_payment_channels")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">{t("pos_transactions_table")}</CardTitle>
          <CardDescription className="text-xs">
            {t("pos_transactions_table_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">{t("pos_invoice_number")}</th>
                  <th className="px-6 py-3.5">{t("common_date")}</th>
                  <th className="px-6 py-3.5">{t("pos_customer_name")}</th>
                  <th className="px-6 py-3.5">{t("pay_method")}</th>
                  <th className="px-6 py-3.5">{t("pos_items_sold")}</th>
                  <th className="px-6 py-3.5 text-right">{t("common_total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Receipt className="h-3.5 w-3.5" />
                        {sale.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-foreground">
                        {sale.customer_name || t("pos_walk_in")}
                      </div>
                      {sale.customer_phone && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          {sale.customer_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {getPaymentBadge(sale.payment_method)}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                      {sale.items?.length > 0 ? (
                        <span>
                          {sale.items
                            .map((i: any) => `${i.product?.name || "Item"} (${i.quantity}${i.unit?.symbol || ""})`)
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="italic">{t("common_items_count")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground font-mono">
                      {formatETB(sale.total_amount)}
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
