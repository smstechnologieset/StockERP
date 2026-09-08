import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "./ProductsClient";
import type { Product, Unit } from "@/types/database";

export const revalidate = 0;

export default async function ProductsPage() {
  let products: (Product & { default_unit?: Unit })[] = [];
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

    if (unitsData) {
      units = unitsData;
    }

    // Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select("*, default_unit:units(*)")
      .order("name", { ascending: true });

    if (productsData) {
      products = productsData;
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
