import { createClient } from "@/lib/supabase/server";
import { ReceiveStockForm } from "./ReceiveStockForm";
import type { Product, Unit, Supplier } from "@/types/database";
import { STANDARD_UNITS } from "@/lib/constants/units";

export const revalidate = 0;

export default async function NewPurchasePage() {
  let products: Product[] = [];
  let units: Unit[] = [];
  let suppliers: Supplier[] = [];

  try {
    const supabase = createClient();

    const [prodRes, unitsRes, supRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("units").select("*").order("conversion_factor"),
      supabase.from("suppliers").select("*").eq("is_active", true).order("name"),
    ]);

    if (prodRes.data) products = prodRes.data;
    if (unitsRes.data) units = unitsRes.data;
    if (supRes.data) suppliers = supRes.data;
  } catch (error) {
    console.error("Error fetching purchase form data:", error);
  }

  // Fallback sample data if database not yet seeded
  if (products.length === 0) {
    products = [
      {
        id: "demo-1",
        name: "Berbere Special Grade 1",
        code: "BER-001",
        category: "Powders & Spices",
        description: "",
        default_unit_id: "2",
        reorder_threshold_base_units: 10000,
        cost_price_per_base_unit: 0.65,
        selling_price_per_base_unit: 0.9,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-2",
        name: "Sinde (Wheat Grain)",
        code: "WHT-001",
        category: "Whole Grains",
        description: "",
        default_unit_id: "3",
        reorder_threshold_base_units: 200000,
        cost_price_per_base_unit: 0.048,
        selling_price_per_base_unit: 0.065,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-3",
        name: "Ater (Split Yellow Peas)",
        code: "ATR-001",
        category: "Pulses / Legumes",
        description: "",
        default_unit_id: "2",
        reorder_threshold_base_units: 15000,
        cost_price_per_base_unit: 0.12,
        selling_price_per_base_unit: 0.16,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-4",
        name: "Barley / Gebs",
        code: "BAR-001",
        category: "Whole Grains",
        description: "",
        default_unit_id: "3",
        reorder_threshold_base_units: 150000,
        cost_price_per_base_unit: 0.042,
        selling_price_per_base_unit: 0.058,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "demo-5",
        name: "Cooking Oil 5L (የምግብ ዘይት)",
        code: "OIL-5L",
        category: "Edible Oils & Liquids",
        description: "",
        default_unit_id: "10000000-0000-0000-0000-000000000007",
        reorder_threshold_base_units: 10,
        cost_price_per_base_unit: 240,
        selling_price_per_base_unit: 290,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
  }

  if (units.length === 0) {
    units = STANDARD_UNITS;
  }

  if (suppliers.length === 0) {
    suppliers = [
      {
        id: "sup-1",
        name: "Arsi Bale Farmers Grain Cooperative",
        contact_person: "Ato Tadesse Gemeda",
        phone: "+251 911 234567",
        address: "Bale Robe, Oromia",
        notes: "",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
      {
        id: "sup-2",
        name: "Merkato Spice Wholesalers Union",
        contact_person: "W/ro Almaz Bekele",
        phone: "+251 922 987654",
        address: "Merkato, Addis Ababa",
        notes: "",
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
  }

  return (
    <ReceiveStockForm
      products={products}
      units={units}
      suppliers={suppliers}
    />
  );
}
