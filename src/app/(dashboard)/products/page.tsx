import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "./ProductsClient";
import type { Unit } from "@/types/database";
import type { ProductWithStock } from "@/components/products/ProductFormModal";
import { STANDARD_UNITS } from "@/lib/constants/units";

export const revalidate = 0;

export default async function ProductsPage() {
  let products: ProductWithStock[] = [];
  let units: Unit[] = [];
  let isManager = true; // Default fallback to manager for MVP development

  try {
    const supabase = createClient();

    // Check user role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      isManager = profile?.role === "owner_manager";
    }

    // Fetch units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .order("conversion_factor", { ascending: true });

    if (unitsData && unitsData.length > 0) {
      units = unitsData;
    } else {
      units = STANDARD_UNITS;
    }

    // Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select("*, default_unit:units(*)")
      .order("name", { ascending: true });

    // Fetch live stock
    const { data: stockData } = await supabase
      .from("view_product_current_stock")
      .select("product_id, current_stock_default_unit, current_stock_base_units, is_low_stock");

    const stockMap = new Map<
      string,
      { current_stock_default_unit: number; current_stock_base_units: number; is_low_stock: boolean }
    >();

    if (stockData) {
      for (const s of stockData) {
        stockMap.set(s.product_id, {
          current_stock_default_unit: Number(s.current_stock_default_unit) || 0,
          current_stock_base_units: Number(s.current_stock_base_units) || 0,
          is_low_stock: Boolean(s.is_low_stock),
        });
      }
    }

    if (productsData) {
      products = productsData.map((p) => {
        const stock = stockMap.get(p.id);
        return {
          ...p,
          current_stock_default_unit: stock?.current_stock_default_unit ?? 0,
          current_stock_base_units: stock?.current_stock_base_units ?? 0,
          is_low_stock: stock?.is_low_stock ?? false,
        };
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <ProductsClient
      initialProducts={products}
      units={units}
      isManager={isManager}
    />
  );
}
