"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CustomerCredit, CreditPayment, PaymentMethod } from "@/types/database";

export interface RecordCreditPaymentInput {
  credit_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_note?: string;
}

export async function getCustomerCreditsAction(): Promise<{
  success: boolean;
  data: CustomerCredit[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customer_credits")
      .select(`
        *,
        payments:credit_payments(*),
        sale:sales(invoice_number, sale_date, total_amount)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return gracefully
      console.warn("customer_credits fetch notice:", error.message);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data as CustomerCredit[]) || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function recordCreditPaymentAction(input: RecordCreditPaymentInput) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const amount = Number(input.amount);
    if (!amount || amount <= 0) {
      throw new Error("Payment amount must be greater than 0 ETB.");
    }

    // 1. Fetch current credit record
    const { data: credit, error: fetchErr } = await supabase
      .from("customer_credits")
      .select("*")
      .eq("id", input.credit_id)
      .single();

    if (fetchErr || !credit) {
      throw new Error("Credit account not found.");
    }

    const currentBalance = Number(credit.remaining_balance) || 0;
    if (amount > currentBalance) {
      throw new Error(
        `Payment of ${amount.toLocaleString()} ETB exceeds remaining debt of ${currentBalance.toLocaleString()} ETB.`
      );
    }

    const newPaidAmount = Number((Number(credit.paid_amount || 0) + amount).toFixed(2));
    const newRemainingBalance = Number((currentBalance - amount).toFixed(2));
    const newStatus = newRemainingBalance <= 0 ? "paid" : "partially_paid";

    // 2. Insert payment record
    const { data: payment, error: paymentErr } = await supabase
      .from("credit_payments")
      .insert({
        credit_id: input.credit_id,
        amount: amount,
        payment_method: input.payment_method || "cash",
        reference_note: input.reference_note || null,
        recorded_by: user?.id || null,
      })
      .select()
      .single();

    if (paymentErr) {
      throw new Error(`Failed to record payment entry: ${paymentErr.message}`);
    }

    // 3. Update customer_credits table
    const { error: updateErr } = await supabase
      .from("customer_credits")
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: newRemainingBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.credit_id);

    if (updateErr) {
      throw new Error(`Failed to update credit balance: ${updateErr.message}`);
    }

    revalidatePath("/credit");
    revalidatePath("/sales");
    revalidatePath("/manager");
    revalidatePath("/reports");

    return {
      success: true,
      remainingBalance: newRemainingBalance,
      status: newStatus,
      paymentId: payment.id,
    };
  } catch (error: any) {
    console.error("Credit payment error:", error);
    return { success: false, error: error.message };
  }
}
