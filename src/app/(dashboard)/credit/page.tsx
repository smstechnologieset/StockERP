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

  // Demo fallback if table is empty or just created
  if (credits.length === 0 && !fetchError) {
    credits = [
      {
        id: "demo-c-1",
        branch_id: "00000000-0000-0000-0000-000000000001",
        sale_id: null,
        customer_name: "Almaz Tadesse (Bole Groceries)",
        customer_phone: "+251 91 123 4567",
        total_sale_amount: 15400.0,
        down_payment_at_sale: 5000.0,
        total_credit_amount: 15400.0,
        paid_amount: 5000.0,
        remaining_balance: 10400.0,
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        status: "partially_paid",
        notes: "Agreement: Will pay remaining 10,400 ETB in two bi-weekly installments.",
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        sale: {
          id: "s-1",
          branch_id: "00000000-0000-0000-0000-000000000001",
          invoice_number: "INV-891023",
          customer_name: "Almaz Tadesse",
          customer_phone: "+251 91 123 4567",
          payment_method: "credit",
          total_amount: 15400.0,
          sale_date: new Date(Date.now() - 3 * 86400000).toISOString(),
          notes: null,
          recorded_by: null,
          created_at: new Date().toISOString(),
        },
        payments: [
          {
            id: "cp-1",
            credit_id: "demo-c-1",
            amount: 5000.0,
            payment_method: "telebirr",
            payment_date: new Date(Date.now() - 3 * 86400000).toISOString(),
            reference_note: "Down payment via Telebirr (Ref: TB8912)",
            recorded_by: null,
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: "demo-c-2",
        branch_id: "00000000-0000-0000-0000-000000000001",
        sale_id: null,
        customer_name: "Tewodros Kassaye (Mercato Spice House)",
        customer_phone: "+251 92 987 6543",
        total_sale_amount: 28500.0,
        down_payment_at_sale: 0.0,
        total_credit_amount: 28500.0,
        paid_amount: 0.0,
        remaining_balance: 28500.0,
        due_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], // Overdue
        status: "unpaid",
        notes: "100% credit approved by Manager. Promised payment within 15 days.",
        created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        sale: {
          id: "s-2",
          branch_id: "00000000-0000-0000-0000-000000000001",
          invoice_number: "INV-782109",
          customer_name: "Tewodros Kassaye",
          customer_phone: "+251 92 987 6543",
          payment_method: "credit",
          total_amount: 28500.0,
          sale_date: new Date(Date.now() - 17 * 86400000).toISOString(),
          notes: null,
          recorded_by: null,
          created_at: new Date().toISOString(),
        },
        payments: [],
      },
      {
        id: "demo-c-3",
        branch_id: "00000000-0000-0000-0000-000000000001",
        sale_id: null,
        customer_name: "Bethelhem Assefa (Piazza Bakery)",
        customer_phone: "+251 94 456 7890",
        total_sale_amount: 9800.0,
        down_payment_at_sale: 2000.0,
        total_credit_amount: 9800.0,
        paid_amount: 9800.0,
        remaining_balance: 0.0,
        due_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
        status: "paid",
        notes: "Settled in full via CBE Birr.",
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        sale: {
          id: "s-3",
          branch_id: "00000000-0000-0000-0000-000000000001",
          invoice_number: "INV-654321",
          customer_name: "Bethelhem Assefa",
          customer_phone: "+251 94 456 7890",
          payment_method: "credit",
          total_amount: 9800.0,
          sale_date: new Date(Date.now() - 20 * 86400000).toISOString(),
          notes: null,
          recorded_by: null,
          created_at: new Date().toISOString(),
        },
        payments: [
          {
            id: "cp-2",
            credit_id: "demo-c-3",
            amount: 2000.0,
            payment_method: "cash",
            payment_date: new Date(Date.now() - 20 * 86400000).toISOString(),
            reference_note: "Initial down payment",
            recorded_by: null,
            created_at: new Date().toISOString(),
          },
          {
            id: "cp-3",
            credit_id: "demo-c-3",
            amount: 7800.0,
            payment_method: "cbe_birr",
            payment_date: new Date(Date.now() - 5 * 86400000).toISOString(),
            reference_note: "Full final installment via CBE Birr",
            recorded_by: null,
            created_at: new Date().toISOString(),
          },
        ],
      },
    ];
  }

  return <CreditClient initialCredits={credits} initialError={fetchError} />;
}
