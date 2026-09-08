"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Search,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Plus,
  Receipt,
  FileText,
  Banknote,
  Smartphone,
  Building,
  Loader2,
  ChevronRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatETB } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { recordCreditPaymentAction } from "@/app/actions/credit";
import type { CustomerCredit, PaymentMethod } from "@/types/database";

interface CreditClientProps {
  initialCredits: CustomerCredit[];
  initialError: string | null;
}

export function CreditClient({ initialCredits, initialError }: CreditClientProps) {
  const router = useRouter();
  const { t, isAmharic } = useLanguage();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [credits, setCredits] = useState<CustomerCredit[]>(initialCredits);

  // Repayment Modal State
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CustomerCredit | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("telebirr");
  const [referenceNote, setReferenceNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCredit, setHistoryCredit] = useState<CustomerCredit | null>(null);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let totalCollected = 0;
    let totalExtended = 0;
    let overdueCount = 0;
    let activeDebtors = 0;

    const today = new Date().toISOString().split("T")[0];

    credits.forEach((c) => {
      const remaining = Number(c.remaining_balance) || 0;
      const paid = Number(c.paid_amount) || 0;
      const total = Number(c.total_sale_amount) || 0;

      totalOutstanding += remaining;
      totalCollected += paid;
      totalExtended += total;

      if (remaining > 0) {
        activeDebtors++;
        if (c.due_date && c.due_date < today) {
          overdueCount++;
        }
      }
    });

    return {
      totalOutstanding,
      totalCollected,
      totalExtended,
      overdueCount,
      activeDebtors,
    };
  }, [credits]);

  // Filter credits
  const filteredCredits = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return credits.filter((c) => {
      const matchSearch =
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.customer_phone && c.customer_phone.includes(search)) ||
        (c.sale?.invoice_number &&
          c.sale.invoice_number.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      const isOverdue =
        Number(c.remaining_balance) > 0 && c.due_date && c.due_date < today;

      if (selectedStatus === "all") return true;
      if (selectedStatus === "unpaid") return c.status === "unpaid";
      if (selectedStatus === "partially_paid") return c.status === "partially_paid";
      if (selectedStatus === "paid") return c.status === "paid";
      if (selectedStatus === "overdue") return isOverdue;

      return true;
    });
  }, [credits, search, selectedStatus]);

  function handleOpenRepayment(credit: CustomerCredit) {
    setSelectedCredit(credit);
    setPaymentAmount(Number(credit.remaining_balance));
    setPaymentMethod("telebirr");
    setReferenceNote("");
    setRepayError(null);
    setRepayModalOpen(true);
  }

  function handleOpenHistory(credit: CustomerCredit) {
    setHistoryCredit(credit);
    setHistoryModalOpen(true);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCredit) return;

    if (!paymentAmount || paymentAmount <= 0) {
      setRepayError("Payment amount must be greater than 0 ETB.");
      return;
    }

    if (paymentAmount > Number(selectedCredit.remaining_balance)) {
      setRepayError(
        `Payment amount cannot exceed remaining balance of ${formatETB(selectedCredit.remaining_balance)}`
      );
      return;
    }

    setSubmitting(true);
    setRepayError(null);

    const res = await recordCreditPaymentAction({
      credit_id: selectedCredit.id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      reference_note: referenceNote || undefined,
    });

    if (res.success) {
      // Optimistically update local state
      setCredits((prev) =>
        prev.map((c) => {
          if (c.id === selectedCredit.id) {
            const newPaid = Number((c.paid_amount + paymentAmount).toFixed(2));
            const newRemaining = Number((c.remaining_balance - paymentAmount).toFixed(2));
            const newStatus = (newRemaining <= 0 ? "paid" : "partially_paid") as any;
            const newPayments = [
              ...(c.payments || []),
              {
                id: res.paymentId || `temp-${Date.now()}`,
                credit_id: c.id,
                amount: paymentAmount,
                payment_method: paymentMethod,
                payment_date: new Date().toISOString(),
                reference_note: referenceNote || null,
                recorded_by: null,
                created_at: new Date().toISOString(),
              },
            ];
            return {
              ...c,
              paid_amount: newPaid,
              remaining_balance: newRemaining,
              status: newStatus,
              payments: newPayments,
            };
          }
          return c;
        })
      );
      setRepayModalOpen(false);
      router.refresh();
    } else {
      setRepayError(res.error || "Failed to record payment.");
    }
    setSubmitting(false);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <CreditCard className="h-7 w-7 text-amber-600" />
            {t("credit_page_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("credit_page_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            onClick={() => router.push("/sales/new")}
          >
            <Plus className="mr-1.5 h-4 w-4" /> {t("btn_new_sale")} ({t("pay_credit")})
          </Button>
        </div>
      </div>

      {initialError && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <strong>Database Notice:</strong> {initialError}. Showing localized fallback data for demonstration.
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <Card className="border-red-500/30 bg-red-50/10 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("credit_total_outstanding")}</span>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatETB(metrics.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic
                ? `በ${metrics.activeDebtors} ንቁ ባለእዳዎች ላይ ያለ`
                : `Across ${metrics.activeDebtors} ${t("credit_active_debtors")}`}
            </p>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="border-emerald-600/30 bg-emerald-50/10 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("credit_total_collected")}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatETB(metrics.totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "ቅድመ ክፍያዎች እና ተከፋዮች" : "Down payments & installments"}
            </p>
          </CardContent>
        </Card>

        {/* Total Credit Extended */}
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isAmharic ? "ጠቅላላ የተሰጠ ብድር" : "Total Credit Extended"}</span>
              <Receipt className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatETB(metrics.totalExtended)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "በታሪክ የተሰጡ ጠቅላላ የብድር ደረሰኞች" : "Total historical credit invoices"}
            </p>
          </CardContent>
        </Card>

        {/* Overdue Accounts */}
        <Card className={metrics.overdueCount > 0 ? "border-amber-600/40 bg-amber-50/20" : "border"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{t("credit_overdue_count")}</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.overdueCount} {isAmharic ? "መለያዎች" : "Accounts"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAmharic ? "የተሰጠው የመክፈያ ቀን ያለፈባቸው" : "Past designated payment due date"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAmharic ? "በደንበኛ ስም፣ ስልክ፣ ወይም ደረሰኝ ቁጥር ፈልግ..." : "Search by customer name, phone, or invoice..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: t("btn_all") },
                { id: "unpaid", label: t("credit_status_unpaid") },
                { id: "partially_paid", label: t("credit_status_partially_paid") },
                { id: "paid", label: t("credit_status_paid") },
                { id: "overdue", label: t("credit_status_overdue") },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedStatus === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(tab.id)}
                  className="h-8 text-xs whitespace-nowrap"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Credit Accounts Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {isAmharic ? "የደንበኞች የብድር ሂሳብ መዝገብ" : "Customer Credit Accounts"} ({filteredCredits.length})
              </CardTitle>
              <CardDescription className="text-xs">
                {isAmharic
                  ? "ተከታታይ የጥሬ ገንዘብ ወይም የቴሌብር ክፍያዎችን ለመመዝገብ 'ክፍያ መዝግብ' የሚለውን ይጫኑ።"
                  : 'Click "Record Repayment" to log installment cash or Telebirr receipts.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-5 py-3">{isAmharic ? "ደንበኛ" : "Customer"}</th>
                  <th className="px-5 py-3">{isAmharic ? "ደረሰኝና ቀን" : "Invoice & Date"}</th>
                  <th className="px-5 py-3 text-right">{isAmharic ? "ጠቅላላ ሽያጭ" : "Total Sale"}</th>
                  <th className="px-5 py-3 text-right">{t("credit_down_payment")}</th>
                  <th className="px-5 py-3 text-right">{isAmharic ? "የተከፈለ መጠን" : "Paid Amount"}</th>
                  <th className="px-5 py-3 text-right text-red-600 dark:text-red-400">{t("credit_remaining_balance")}</th>
                  <th className="px-5 py-3 text-center">{t("credit_due_date")}</th>
                  <th className="px-5 py-3 text-center">{t("common_status")}</th>
                  <th className="px-5 py-3 text-right">{t("common_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCredits.map((c) => {
                  const remaining = Number(c.remaining_balance) || 0;
                  const isOverdue = remaining > 0 && c.due_date && c.due_date < today;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          {c.customer_name}
                        </div>
                        {c.customer_phone && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {c.customer_phone}
                          </div>
                        )}
                        {c.notes && (
                          <div className="text-[10px] text-muted-foreground/80 italic mt-0.5 line-clamp-1">
                            &ldquo;{c.notes}&rdquo;
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono font-medium text-foreground">
                          {c.sale?.invoice_number || "POS Sale"}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right font-medium text-foreground">
                        {formatETB(c.total_sale_amount)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatETB(c.down_payment_at_sale)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatETB(c.paid_amount)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-sm">
                        {remaining > 0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            {formatETB(remaining)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium">
                            0.00 {isAmharic ? "ብር (የተከፈለ)" : "ETB (Settled)"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {c.due_date ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-medium text-foreground">
                              {c.due_date}
                            </span>
                            {isOverdue && (
                              <div>
                                <Badge variant="danger" className="text-[9px] px-1 py-0 uppercase">
                                  {isAmharic ? "ቀኑ ያለፈበት" : "Overdue"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {remaining <= 0 ? (
                          <Badge variant="success" className="text-[10px]">
                            {t("credit_status_paid")}
                          </Badge>
                        ) : c.paid_amount > 0 ? (
                          <Badge variant="info" className="text-[10px]">
                            {t("credit_status_partially_paid")}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">
                            {t("credit_status_unpaid")}
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {remaining > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenRepayment(c)}
                              className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                            >
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {t("btn_record_repayment")}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-7 text-xs px-2 text-emerald-700 bg-emerald-50/50"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {isAmharic ? "ተጠናቋል" : "Settled"}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenHistory(c)}
                            title={isAmharic ? "የክፍያ ታሪክ እይ" : "View Payment History"}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCredits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="h-32 text-center text-muted-foreground">
                      {isAmharic ? "ምንም የብድር መረጃ አልተገኘም።" : "No credit records match your filter criteria."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* REPAYMENT MODAL */}
      <Dialog open={repayModalOpen} onOpenChange={setRepayModalOpen}>
        <DialogContent className="max-w-md" onClose={() => setRepayModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              {t("credit_repay_modal_title")}
            </DialogTitle>
            <DialogDescription>
              {t("credit_repay_modal_desc")}
            </DialogDescription>
          </DialogHeader>

          {repayError && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
              {repayError}
            </div>
          )}

          {selectedCredit && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Customer summary box */}
              <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAmharic ? "ደንበኛ:" : "Customer:"}</span>
                  <span className="font-semibold text-foreground">{selectedCredit.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAmharic ? "የደረሰኝ ቁጥር:" : "Invoice Reference:"}</span>
                  <span className="font-mono">{selectedCredit.sale?.invoice_number || (isAmharic ? "የሽያጭ ደረሰኝ" : "POS Invoice")}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">{t("credit_remaining_balance")}:</span>
                  <strong className="text-red-600 text-sm font-bold">
                    {formatETB(selectedCredit.remaining_balance)}
                  </strong>
                </div>
              </div>

              {/* Repay Presets */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setPaymentAmount(Number(selectedCredit.remaining_balance))}
                >
                  {t("credit_repay_full")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() =>
                    setPaymentAmount(
                      Number((Number(selectedCredit.remaining_balance) * 0.5).toFixed(2))
                    )
                  }
                >
                  {isAmharic ? "50% ከፊል ክፍያ ክፈል" : "Pay 50% Installment"}
                </Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <Label htmlFor="paymentAmount" className="text-xs font-semibold">
                  {t("credit_repay_amount_label")}
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(selectedCredit.remaining_balance)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="text-sm font-semibold"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {isAmharic ? "አዲስ የቀረ እዳ፡" : "New Remaining Debt:"}{" "}
                  <strong>
                    {formatETB(
                      Math.max(0, Number(selectedCredit.remaining_balance) - paymentAmount)
                    )}
                  </strong>
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("pay_method")} *</Label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: "cash", label: t("pay_cash"), icon: Banknote },
                    { id: "telebirr", label: t("pay_telebirr"), icon: Smartphone },
                    { id: "cbe_birr", label: t("pay_cbe_birr"), icon: Smartphone },
                    { id: "bank_transfer", label: isAmharic ? "ባንክ" : "Bank", icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-[11px] ${
                          isSel
                            ? "bg-amber-600 text-white border-amber-600 font-bold"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference Note */}
              <div className="space-y-1">
                <Label htmlFor="referenceNote" className="text-xs">
                  {t("credit_ref_note_label")}
                </Label>
                <Input
                  id="referenceNote"
                  placeholder={t("credit_ref_note_placeholder")}
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRepayModalOpen(false)}
                >
                  {t("btn_cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isAmharic ? "በመመዝገብ ላይ..." : "Recording..."}
                    </>
                  ) : (
                    isAmharic
                      ? `ክፍያ አረጋግጥ (${formatETB(paymentAmount)})`
                      : `Confirm Payment (${formatETB(paymentAmount)})`
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* INSTALLMENT HISTORY MODAL */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg" onClose={() => setHistoryModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-600" />
              {t("credit_history_modal_title")}
            </DialogTitle>
            <DialogDescription>
              {isAmharic
                ? `ለ${historyCredit?.customer_name} የተከፈሉ ከፊል ክፍያዎች ዝርዝር መዝገብ።`
                : `Complete record of installments received for ${historyCredit?.customer_name}.`}
            </DialogDescription>
          </DialogHeader>

          {historyCredit && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg text-xs text-center">
                <div>
                  <span className="text-muted-foreground block">{isAmharic ? "ጠቅላላ ብድር:" : "Total Credit:"}</span>
                  <strong className="text-foreground">{formatETB(historyCredit.total_sale_amount)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isAmharic ? "የተከፈለ:" : "Total Repaid:"}</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {formatETB(historyCredit.paid_amount)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">{isAmharic ? "ቀሪ እዳ:" : "Remaining:"}</span>
                  <strong className="text-red-600">
                    {formatETB(historyCredit.remaining_balance)}
                  </strong>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {historyCredit.payments && historyCredit.payments.length > 0 ? (
                  historyCredit.payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2.5 rounded-lg border bg-card flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{formatETB(p.amount)}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {p.payment_method}
                          </Badge>
                        </div>
                        {p.reference_note && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {p.reference_note}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        {new Date(p.payment_date || p.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    {isAmharic ? "ለዚህ የብድር ሂሳብ እስካሁን የተመዘገበ ክፍያ የለም።" : "No installment payments recorded yet for this credit account."}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setHistoryModalOpen(false)}
                >
                  {t("btn_close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
