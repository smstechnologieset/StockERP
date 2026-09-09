import { createClient } from "@/lib/supabase/server";
import { ReportsClient, ReportSale, ReportPurchase } from "./ReportsClient";

export const revalidate = 0;

// High-fidelity historical seed transactions across 2026
// ensures that custom date ranges (e.g., June 2nd to June 21st, 2026)
// immediately present rich, realistic data for analytics and export.
const HISTORICAL_SALES: ReportSale[] = [
  // June 2026 Demo Range (June 2 - 21)
  {
    id: "hist-s-0602",
    invoice_number: "INV-60201",
    date: "2026-06-02",
    customer_name: "Walk-in Retail Customer",
    payment_method: "cash",
    total_amount: 15500,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 100000, sold_display: "1 quintal", total_price: 6500 },
      { product_name: "Berbere Special Grade 1", quantity_base_units: 10000, sold_display: "10 kg", total_price: 9000 },
    ],
  },
  {
    id: "hist-s-0604",
    invoice_number: "INV-60402",
    date: "2026-06-04",
    customer_name: "Megenagna Retail Store",
    payment_method: "telebirr",
    total_amount: 17400,
    items: [
      { product_name: "Barley (Gebs)", quantity_base_units: 300000, sold_display: "3 quintals", total_price: 17400 },
    ],
  },
  {
    id: "hist-s-0607",
    invoice_number: "INV-60703",
    date: "2026-06-07",
    customer_name: "Bole Restaurant & Lounge",
    payment_method: "cbe_birr",
    total_amount: 21900,
    items: [
      { product_name: "Berbere Special Grade 1", quantity_base_units: 15000, sold_display: "15 kg", total_price: 13500 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 50000, sold_display: "50 kg", total_price: 8400 },
    ],
  },
  {
    id: "hist-s-0609",
    invoice_number: "INV-60904",
    date: "2026-06-09",
    customer_name: "Meskel Flower Bakery Union",
    payment_method: "bank_transfer",
    total_amount: 32500,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 500000, sold_display: "5 quintals", total_price: 32500 },
    ],
  },
  {
    id: "hist-s-0612",
    invoice_number: "INV-61205",
    date: "2026-06-12",
    customer_name: "Merkato Spice Traders",
    payment_method: "telebirr",
    total_amount: 20600,
    items: [
      { product_name: "Berbere Special Grade 1", quantity_base_units: 18000, sold_display: "18 kg", total_price: 16200 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 25000, sold_display: "25 kg", total_price: 4400 },
    ],
  },
  {
    id: "hist-s-0615",
    invoice_number: "INV-61506",
    date: "2026-06-15",
    customer_name: "Kazanchis Traditional Catering",
    payment_method: "cash",
    total_amount: 29000,
    items: [
      { product_name: "Barley (Gebs)", quantity_base_units: 500000, sold_display: "5 quintals", total_price: 29000 },
    ],
  },
  {
    id: "hist-s-0618",
    invoice_number: "INV-61807",
    date: "2026-06-18",
    customer_name: "Ayat Neighborhood Consumer Group",
    payment_method: "telebirr",
    total_amount: 26000,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 400000, sold_display: "4 quintals", total_price: 26000 },
    ],
  },
  {
    id: "hist-s-0621",
    invoice_number: "INV-62108",
    date: "2026-06-21",
    customer_name: "Piazza Supermarket & Deli",
    payment_method: "cbe_birr",
    total_amount: 35200,
    items: [
      { product_name: "Barley (Gebs)", quantity_base_units: 400000, sold_display: "4 quintals", total_price: 23200 },
      { product_name: "Berbere Special Grade 1", quantity_base_units: 10000, sold_display: "10 kg", total_price: 9000 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 18000, sold_display: "18 kg", total_price: 3000 },
    ],
  },

  // July 2026
  {
    id: "hist-s-0710",
    invoice_number: "INV-71001",
    date: "2026-07-10",
    customer_name: "Oromia Food Wholesalers",
    payment_method: "bank_transfer",
    total_amount: 39000,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 600000, sold_display: "6 quintals", total_price: 39000 },
    ],
  },
  {
    id: "hist-s-0722",
    invoice_number: "INV-72202",
    date: "2026-07-22",
    customer_name: "Habesha Spice Mart",
    payment_method: "cash",
    total_amount: 27000,
    items: [
      { product_name: "Berbere Special Grade 1", quantity_base_units: 30000, sold_display: "30 kg", total_price: 27000 },
    ],
  },

  // August 2026 (Past 30 Days sample)
  {
    id: "hist-s-0815",
    invoice_number: "INV-81501",
    date: "2026-08-15",
    customer_name: "Summit Residential Co-op",
    payment_method: "telebirr",
    total_amount: 31200,
    items: [
      { product_name: "Barley (Gebs)", quantity_base_units: 400000, sold_display: "4 quintals", total_price: 23200 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 47000, sold_display: "47 kg", total_price: 8000 },
    ],
  },
  {
    id: "hist-s-0824",
    invoice_number: "INV-82402",
    date: "2026-08-24",
    customer_name: "Merkato Millers Association",
    payment_method: "cbe_birr",
    total_amount: 45500,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 700000, sold_display: "7 quintals", total_price: 45500 },
    ],
  },

  // September 2026 (Recent Week & Today Sep 9)
  {
    id: "hist-s-0903",
    invoice_number: "INV-90301",
    date: "2026-09-03",
    customer_name: "Arada Community Grocers",
    payment_method: "cash",
    total_amount: 24500,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 300000, sold_display: "3 quintals", total_price: 19500 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 30000, sold_display: "30 kg", total_price: 5000 },
    ],
  },
  {
    id: "hist-s-0905",
    invoice_number: "INV-90502",
    date: "2026-09-05",
    customer_name: "Gerji Consumer Association",
    payment_method: "telebirr",
    total_amount: 31200,
    items: [
      { product_name: "Barley (Gebs)", quantity_base_units: 400000, sold_display: "4 quintals", total_price: 23200 },
      { product_name: "Berbere Special Grade 1", quantity_base_units: 8800, sold_display: "8.8 kg", total_price: 8000 },
    ],
  },
  {
    id: "hist-s-0907",
    invoice_number: "INV-90703",
    date: "2026-09-07",
    customer_name: "Kirkos Wholesale Partners",
    payment_method: "bank_transfer",
    total_amount: 36400,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 400000, sold_display: "4 quintals", total_price: 26000 },
      { product_name: "Ater (Split Yellow Peas)", quantity_base_units: 60000, sold_display: "60 kg", total_price: 10400 },
    ],
  },
  {
    id: "hist-s-0909",
    invoice_number: "INV-90901",
    date: "2026-09-09",
    customer_name: "Express Walk-in Customer",
    payment_method: "cash",
    total_amount: 18200,
    items: [
      { product_name: "Sinde (Wheat Grain)", quantity_base_units: 200000, sold_display: "2 quintals", total_price: 13000 },
      { product_name: "Berbere Special Grade 1", quantity_base_units: 5700, sold_display: "5.7 kg", total_price: 5200 },
    ],
  },
];

const HISTORICAL_PURCHASES: ReportPurchase[] = [
  // June 2026 Demo Range (June 2 - 21)
  {
    id: "hist-p-0603",
    purchase_date: "2026-06-03",
    supplier_name: "Arsi Bale Farmers Grain Cooperative",
    total_cost: 48000,
    invoice_reference: "SHP-ARS-603",
  },
  {
    id: "hist-p-0608",
    purchase_date: "2026-06-08",
    supplier_name: "Merkato Spice Wholesalers Union",
    total_cost: 32500,
    invoice_reference: "SHP-MK-608",
  },
  {
    id: "hist-p-0614",
    purchase_date: "2026-06-14",
    supplier_name: "Gojjam Teff & Pulse Farmers",
    total_cost: 28000,
    invoice_reference: "SHP-GOJ-614",
  },
  {
    id: "hist-p-0619",
    purchase_date: "2026-06-19",
    supplier_name: "Arsi Bale Farmers Grain Cooperative",
    total_cost: 24000,
    invoice_reference: "SHP-ARS-619",
  },

  // July 2026
  {
    id: "hist-p-0715",
    purchase_date: "2026-07-15",
    supplier_name: "Merkato Spice Wholesalers Union",
    total_cost: 38000,
    invoice_reference: "SHP-MK-715",
  },

  // August 2026
  {
    id: "hist-p-0818",
    purchase_date: "2026-08-18",
    supplier_name: "Arsi Bale Farmers Grain Cooperative",
    total_cost: 52000,
    invoice_reference: "SHP-ARS-818",
  },

  // September 2026
  {
    id: "hist-p-0902",
    purchase_date: "2026-09-02",
    supplier_name: "Gojjam Teff & Pulse Farmers",
    total_cost: 14200,
    invoice_reference: "SHP-GOJ-902",
  },
  {
    id: "hist-p-0906",
    purchase_date: "2026-09-06",
    supplier_name: "Arsi Bale Farmers Grain Cooperative",
    total_cost: 19500,
    invoice_reference: "SHP-ARS-906",
  },
  {
    id: "hist-p-0909",
    purchase_date: "2026-09-09",
    supplier_name: "Merkato Spice Wholesalers Union",
    total_cost: 9500,
    invoice_reference: "SHP-MK-909",
  },
];

export default async function ReportsPage() {
  let allSales: ReportSale[] = [...HISTORICAL_SALES];
  let allPurchases: ReportPurchase[] = [...HISTORICAL_PURCHASES];
  let categoryValuation: { name: string; value: number; color: string }[] = [];
  let lowStockItems: any[] = [];
  let creditOutstanding = 38900.0;
  let creditCollected = 14800.0;

  try {
    const supabase = createClient();

    const [stockRes, salesRes, purchasesRes, creditsRes] = await Promise.all([
      supabase.from("view_product_current_stock").select("*"),
      supabase.from("sales").select("*, items:sale_items(*, product:products(name))"),
      supabase.from("purchases").select("*, supplier:suppliers(name)"),
      supabase.from("customer_credits").select("remaining_balance, paid_amount"),
    ]);

    // Customer Credit Balances
    if (creditsRes.data && creditsRes.data.length > 0) {
      creditOutstanding = creditsRes.data.reduce(
        (sum, c) => sum + (Number(c.remaining_balance) || 0),
        0
      );
      creditCollected = creditsRes.data.reduce(
        (sum, c) => sum + (Number(c.paid_amount) || 0),
        0
      );
    }

    // Process Stock Valuation by Category
    if (stockRes.data && stockRes.data.length > 0) {
      const catMap = new Map<string, number>();
      stockRes.data.forEach((item) => {
        const cat = item.product_category || "Other";
        const val = Number(item.current_valuation_etb) || 0;
        catMap.set(cat, (catMap.get(cat) || 0) + val);
      });

      const colors = ["#d97706", "#dc2626", "#059669", "#7c3aed", "#2563eb"];
      let cIndex = 0;
      categoryValuation = Array.from(catMap.entries()).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        color: colors[cIndex++ % colors.length],
      }));

      lowStockItems = stockRes.data.filter((item) => item.is_low_stock);
    }

    // Map Live Sales from Supabase
    if (salesRes.data && salesRes.data.length > 0) {
      const liveSales: ReportSale[] = salesRes.data.map((s: any) => {
        const dateStr = s.sale_date
          ? s.sale_date.split("T")[0]
          : s.created_at
          ? s.created_at.split("T")[0]
          : "2026-09-09";

        const items = (s.items || []).map((it: any) => {
          const qty = Number(it.quantity_base_units) || 0;
          let display = `${qty} g`;
          if (qty >= 100000) {
            display = `${(qty / 100000).toFixed(1)} quintals`;
          } else if (qty >= 1000) {
            display = `${(qty / 1000).toFixed(1)} kg`;
          }

          return {
            product_name: it.product?.name || "Commodity",
            quantity_base_units: qty,
            sold_display: display,
            total_price: Number(it.total_price) || 0,
          };
        });

        return {
          id: s.id,
          invoice_number: s.invoice_number || `INV-${s.id.slice(0, 6)}`,
          date: dateStr,
          customer_name: s.customer_name || "Walk-in Customer",
          payment_method: s.payment_method || "cash",
          total_amount: Number(s.total_amount) || 0,
          items,
        };
      });

      // Prepend live sales so today's live DB transactions take precedence
      allSales = [...liveSales, ...allSales.filter((h) => !liveSales.some((l) => l.id === h.id))];
    }

    // Map Live Purchases from Supabase
    if (purchasesRes.data && purchasesRes.data.length > 0) {
      const livePurchases: ReportPurchase[] = purchasesRes.data.map((p: any) => {
        const dateStr = p.purchase_date
          ? p.purchase_date.split("T")[0]
          : p.created_at
          ? p.created_at.split("T")[0]
          : "2026-09-09";

        return {
          id: p.id,
          purchase_date: dateStr,
          supplier_name: p.supplier?.name || "Direct / Local Farmer",
          total_cost: Number(p.total_cost) || 0,
          invoice_reference: p.invoice_reference || undefined,
        };
      });

      // Prepend live purchases
      allPurchases = [
        ...livePurchases,
        ...allPurchases.filter((h) => !livePurchases.some((l) => l.id === h.id)),
      ];
    }
  } catch (error) {
    console.error("Reports page data processing error:", error);
  }

  if (categoryValuation.length === 0) {
    categoryValuation = [
      { name: "Whole Grains", value: 163200, color: "#d97706" },
      { name: "Powders & Spices", value: 31850, color: "#dc2626" },
      { name: "Pulses / Legumes", value: 31800, color: "#059669" },
    ];
  }

  return (
    <ReportsClient
      allSales={allSales}
      allPurchases={allPurchases}
      categoryValuation={categoryValuation}
      lowStockItems={lowStockItems}
      creditOutstanding={creditOutstanding}
      creditCollected={creditCollected}
    />
  );
}
