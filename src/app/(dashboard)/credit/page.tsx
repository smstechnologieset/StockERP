import { createClient } from "@/lib/supabase/server";
import { CreditClient } from "./CreditClient";
import type { CustomerCredit } from "@/types/database";

export const revalidate = 0;

export default async function CreditManagementPage() {
  let credits: CustomerCredit[] = [];
  let fetchError: string | null = null;

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
      fetchError = error.message;
    } else if (data) {
      credits = data as CustomerCredit[];
    }
  } catch (err: any) {
    fetchError = err.message;
  }

  return <CreditClient initialCredits={credits} initialError={fetchError} />;
}
