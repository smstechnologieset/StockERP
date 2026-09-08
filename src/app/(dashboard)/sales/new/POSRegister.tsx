"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  User,
  Phone,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Loader2,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatETB, formatQuantity } from "@/lib/utils";
import { createSaleAction } from "@/app/actions/sales";
import type { Product, Unit, ProductCurrentStockView } from "@/types/database";

import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CartItem {
  productId: string;
  productName: string;
  unitId: string;
  quantity: number;
  unitPrice: number;
  currentStockGrams: number;
}

interface POSRegisterProps {
  products: Product[];
  units: Unit[];
  stockView: ProductCurrentStockView[];
}

export function POSRegister({ products, units, stockView }: POSRegisterProps) {
  const router = useRouter();
  const { t, isAmharic, language } = useLanguage();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState(language === "am" ? "የመጣ ደንበኛ" : "Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "telebirr" | "cbe_birr" | "bank_transfer" | "credit"
  >("cash");
  const [downPayment, setDownPayment] = useState<number>(0);
  const [downPaymentMethod, setDownPaymentMethod] = useState<
    "cash" | "telebirr" | "cbe_birr" | "bank_transfer"
  >("cash");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [creditNotes, setCreditNotes] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<{
    invoiceNumber: string;
    totalAmount: number;
    creditRemaining?: number;
    isCredit?: boolean;
  } | null>(null);

  // Map product id to current stock grams
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stockView.forEach((s) => {
      map.set(s.product_id, Number(s.current_stock_base_units) || 0);
    });
    return map;
  }, [stockView]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()));
      const matchCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Add product to cart
  function addToCart(product: Product) {
    const defaultUnit =
      units.find((u) => u.id === product.default_unit_id) ||
      units.find((u) => u.symbol === "kg") ||
      units[0];
    const factor = defaultUnit?.conversion_factor || 1000;
    const initialPrice = Number((product.selling_price_per_base_unit * factor).toFixed(2)) || 100;
    const stockGrams = stockMap.get(product.id) || 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Number((item.quantity + 1).toFixed(3)) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitId: defaultUnit?.id || "",
          quantity: 1,
          unitPrice: initialPrice,
          currentStockGrams: stockGrams,
        },
      ];
    });
  }

  function updateCartItem(index: number, field: keyof CartItem, value: any) {
    setCart((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };

      // If unit changed, recalculate suggested unit price
      if (field === "unitId") {
        const prod = products.find((p) => p.id === item.productId);
        const u = units.find((x) => x.id === value);
        if (prod && u && prod.selling_price_per_base_unit > 0) {
          item.unitPrice = Number((prod.selling_price_per_base_unit * u.conversion_factor).toFixed(2));
        }
      }

      copy[index] = item;
      return copy;
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculate totals and stock warnings
  let cartTotal = 0;
  let hasInsufficientStock = false;
  const insufficientProducts: string[] = [];

  cart.forEach((item) => {
    const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
    cartTotal += lineTotal;

    const u = units.find((x) => x.id === item.unitId);
    const factor = u?.conversion_factor || 1;
    const requestedGrams = (item.quantity || 0) * factor;

    if (requestedGrams > item.currentStockGrams) {
      hasInsufficientStock = true;
      if (!insufficientProducts.includes(item.productName)) {
        insufficientProducts.push(item.productName);
      }
    }
  });

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    if (hasInsufficientStock && (!manualOverride || !overrideReason.trim())) {
      setErrorMessage(
        language === "am"
          ? "አንዳንድ እቃዎች ካለው ክምችት በላይ ናቸው። ለመቀጠል 'ያለ ክምችት እንዲሸጥ ፈቅጃለሁ' የሚለውን ምልክት በማድረግ ምክንያት ማስገባት አለብዎት።"
          : "Some items exceed available on-hand stock. You must check 'Manual Stock Override' and provide a reason to proceed."
      );
      return;
    }

    if (paymentMethod === "credit") {
      if (!customerName || customerName.trim() === "" || customerName.trim().toLowerCase() === "walk-in customer" || customerName.trim() === "የመጣ ደንበኛ") {
        setErrorMessage(
          language === "am"
            ? "በብድር ለሚደረግ ሽያጭ የደንበኛ ሙሉ ስም መግለጽ ግዴታ ነው።"
            : "A specific Customer Full Name is required for Credit sales."
        );
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      payment_method: paymentMethod,
      manual_override: manualOverride,
      override_reason: manualOverride ? overrideReason : undefined,
      down_payment_at_sale: paymentMethod === "credit" ? downPayment : undefined,
      down_payment_method: paymentMethod === "credit" && downPayment > 0 ? downPaymentMethod : undefined,
      credit_due_date: paymentMethod === "credit" ? dueDate : undefined,
      credit_notes: paymentMethod === "credit" ? creditNotes : undefined,
      items: cart.map((item) => {
        const u = units.find((x) => x.id === item.unitId);
        return {
          product_id: item.productId,
          unit_id: item.unitId,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          conversion_factor: u?.conversion_factor || 1,
        };
      }),
    };

    const res = await createSaleAction(payload);

    if (res.success) {
      setSaleResult({
        invoiceNumber: res.invoiceNumber || "INV-NEW",
        totalAmount: res.totalAmount || cartTotal,
        creditRemaining: paymentMethod === "credit" ? Math.max(0, cartTotal - downPayment) : undefined,
        isCredit: paymentMethod === "credit",
      });
      setCart([]);
      setDownPayment(0);
      setCreditNotes("");
    } else {
      setErrorMessage(res.error || (language === "am" ? "ሽያጩን ማጠናቀቅ አልተቻለም።" : "Failed to complete sale."));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("pos_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pos_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/sales")}
          >
            {t("pos_sales_history_btn")}
          </Button>
        </div>
      </div>

      {/* Sale Complete Modal / Receipt Preview */}
      {saleResult && (
        <Card className="border-emerald-600/40 bg-emerald-50/20 dark:bg-emerald-950/20 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-emerald-950 dark:text-emerald-200">
                  {saleResult.isCredit ? t("pos_credit_sale_recorded") : t("pos_sale_completed")} {t("pos_invoice_number")} #{saleResult.invoiceNumber}
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {t("common_total")} ({t("currency_etb")}):{" "}
                  <strong className="font-mono text-base">
                    {formatETB(saleResult.totalAmount)}
                  </strong>{" "}
                  {saleResult.isCredit && (
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      &bull; {t("credit_remaining_balance")}:{" "}
                      <strong>{formatETB(saleResult.creditRemaining || 0)}</strong>
                    </span>
                  )}
                  &bull; {t("mov_table_desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaleResult(null)}
              >
                {t("btn_new_order")}
              </Button>
              {saleResult.isCredit ? (
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => router.push("/credit")}
                >
                  {t("btn_manage_credit")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => router.push("/sales")}
                >
                  {t("btn_view_sales_log")}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("pos_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Button
                type="button"
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="text-xs h-9 whitespace-nowrap"
              >
                {t("btn_all")}
              </Button>
              {categories.map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={selectedCategory === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(c)}
                  className="text-xs h-9 whitespace-nowrap"
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const stockGrams = stockMap.get(p.id) || 0;
              const defaultUnit =
                units.find((u) => u.id === p.default_unit_id) ||
                units.find((u) => u.symbol === "kg") ||
                units[0];
              const factor = defaultUnit?.conversion_factor || 1000;
              const priceDisplay = p.selling_price_per_base_unit * factor;
              const isOutOfStock = stockGrams <= 0;

              return (
                <Card
                  key={p.id}
                  className="hover:border-amber-600/40 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold text-foreground line-clamp-1">
                          {p.name}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-muted-foreground">
                          {p.category}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={isOutOfStock ? "danger" : "secondary"}
                        className="text-[10px] shrink-0"
                      >
                        {formatQuantity(stockGrams, "g")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div>
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                          {formatETB(priceDisplay)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {" "}
                          / {defaultUnit?.symbol}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(p)}
                        className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="h-3 w-3 mr-1" /> {t("pos_add")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart / POS Invoice (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="shadow-md border border-amber-600/20">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-base font-semibold">{t("pos_active_register")}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {cart.length} {t("pos_line_items")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {errorMessage && (
                <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Cart Line Items */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {cart.map((item, index) => {
                  const u = units.find((x) => x.id === item.unitId);
                  const factor = u?.conversion_factor || 1;
                  const itemGrams = item.quantity * factor;
                  const lineTotal = item.quantity * item.unitPrice;
                  const isNegative = itemGrams > item.currentStockGrams;

                  return (
                    <div
                      key={index}
                      className={`p-2.5 rounded-lg border text-xs space-y-2 transition-all ${
                        isNegative
                          ? "bg-red-50/50 border-red-300 dark:bg-red-950/20"
                          : "bg-card hover:border-amber-600/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {item.productName}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          {formatETB(lineTotal)}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(index)}
                            className="h-6 w-6 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Controls row */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Unit selector */}
                        <div className="col-span-5">
                          <select
                            value={item.unitId}
                            onChange={(e) =>
                              updateCartItem(index, "unitId", e.target.value)
                            }
                            className="h-7 w-full rounded border border-input bg-background px-1 text-[11px]"
                          >
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.symbol} ({unit.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="any"
                            min="0.001"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 text-xs px-2"
                          />
                        </div>

                        {/* Price per unit */}
                        <div className="col-span-4">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateCartItem(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 text-xs px-2 text-right"
                          />
                        </div>
                      </div>

                      {/* Stock on-hand check indicator */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">
                          {t("common_weight")}: {formatQuantity(itemGrams, "g")}
                        </span>
                        {isNegative ? (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {t("common_exceeds_stock")} ({formatQuantity(item.currentStockGrams, "g")})
                          </span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {t("common_available")}: {formatQuantity(item.currentStockGrams, "g")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {cart.length === 0 && (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    {t("pos_empty_cart_hint")}
                  </div>
                )}
              </div>

              {/* Insufficient Stock Override Banner */}
              {hasInsufficientStock && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>{t("pos_insufficient_stock_banner")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("common_items_count")}: <strong>{insufficientProducts.join(", ")}</strong> {t("pos_insufficient_stock_desc")}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="manualOverride"
                      checked={manualOverride}
                      onChange={(e) => setManualOverride(e.target.checked)}
                      className="rounded border-input text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <label
                      htmlFor="manualOverride"
                      className="font-medium text-foreground cursor-pointer"
                    >
                      {t("pos_override_badge")}
                    </label>
                  </div>

                  {manualOverride && (
                    <div className="space-y-1 pt-1">
                      <Label htmlFor="overrideReason" className="text-[11px]">
                        {t("pos_override_reason_label")}
                      </Label>
                      <Input
                        id="overrideReason"
                        placeholder={t("pos_override_reason_placeholder")}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Customer & Payment Form */}
              <div className="pt-2 border-t space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="customerName" className="text-xs">
                      {t("pos_customer_name")}
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customerPhone" className="text-xs">
                      {t("pos_phone_number")}
                    </Label>
                    <Input
                      id="customerPhone"
                      placeholder="+251 9..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{t("pay_method")}</Label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: "cash", label: t("pay_cash"), icon: Banknote },
                      { id: "telebirr", label: t("pay_telebirr"), icon: Smartphone },
                      { id: "cbe_birr", label: t("pay_cbe_birr"), icon: Smartphone },
                      { id: "bank_transfer", label: t("pay_bank_transfer"), icon: Building },
                      { id: "credit", label: t("pay_credit"), icon: CreditCard },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`flex items-center justify-center gap-1.5 rounded-md border p-1.5 font-medium transition-all ${
                            isSelected
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dedicated Credit Agreement Options */}
                {paymentMethod === "credit" && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        {t("pay_credit")} ({t("credit_down_payment")})
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="h-6 text-[10px] px-2 py-0.5 rounded border bg-background font-medium hover:bg-muted"
                          onClick={() => setDownPayment(0)}
                        >
                          100% {t("pay_credit")}
                        </button>
                        <button
                          type="button"
                          className="h-6 text-[10px] px-2 py-0.5 rounded border bg-background font-medium hover:bg-muted"
                          onClick={() => setDownPayment(Number((cartTotal * 0.5).toFixed(2)))}
                        >
                          50% {t("credit_down_payment")}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="downPayment" className="text-[11px] font-medium">
                          {t("credit_down_payment")} (ETB)
                        </Label>
                        <Input
                          id="downPayment"
                          type="number"
                          step="0.01"
                          min="0"
                          max={cartTotal}
                          value={downPayment}
                          onChange={(e) =>
                            setDownPayment(
                              Math.min(cartTotal, Math.max(0, parseFloat(e.target.value) || 0))
                            )
                          }
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="dueDate" className="text-[11px] font-medium">
                          {t("credit_due_date")} *
                        </Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>

                    {downPayment > 0 && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">
                          {t("pos_down_payment_method")}
                        </Label>
                        <div className="grid grid-cols-4 gap-1 text-[11px]">
                          {(["cash", "telebirr", "cbe_birr", "bank_transfer"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setDownPaymentMethod(m)}
                              className={`p-1 rounded border text-center font-medium capitalize text-[10px] ${
                                downPaymentMethod === m
                                  ? "bg-amber-600 text-white border-amber-600 font-bold"
                                  : "bg-background text-muted-foreground"
                              }`}
                            >
                              {m === "bank_transfer"
                                ? (language === "am" ? "ባንክ" : "Bank")
                                : m === "cbe_birr"
                                ? (language === "am" ? "ሲቢኢ" : "CBE")
                                : m === "telebirr"
                                ? (language === "am" ? "ቴሌብር" : "Telebirr")
                                : (language === "am" ? "ጥሬ ገንዘብ" : "Cash")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Balance Computation */}
                    <div className="p-2.5 rounded bg-background/80 border text-[11px] space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("credit_down_payment")}:</span>
                        <span className="font-semibold text-foreground">{formatETB(downPayment)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold">
                        <span className="text-red-600 dark:text-red-400">
                          {t("credit_remaining_balance")}:
                        </span>
                        <span className="text-red-600 dark:text-red-400 text-sm">
                          {formatETB(Math.max(0, cartTotal - downPayment))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="creditNotes" className="text-[11px]">
                        {t("credit_notes")}
                      </Label>
                      <Input
                        id="creditNotes"
                        placeholder={
                          language === "am"
                            ? "ምሳሌ፡ በ2 ዙር ለመክፈል የተደረገ ስምምነት / የዋስ ስም..."
                            : "e.g. Agreement to pay in 2 installments / Guarantor name..."
                        }
                        value={creditNotes}
                        onChange={(e) => setCreditNotes(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Summary and Complete Button */}
              <div className="pt-3 border-t space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {t("pos_total_due")}:
                  </span>
                  <span className="text-2xl font-bold font-heading text-amber-600">
                    {formatETB(cartTotal)}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 text-base font-semibold shadow-md shadow-amber-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("pos_processing_sale")}
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" /> {t("pos_complete_btn")} ({formatETB(cartTotal)})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
