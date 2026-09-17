import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./PricingClient";
import type { Product, Unit } from "@/types/database";

export const revalidate = 0;

export default async function PricingManagementPage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  let products: (Product & { default_unit?: Unit })[] = [];

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, default_unit:units(*)")
      .order("name", { ascending: true });

    if (data) {
      products = data as any;
    }
  } catch (err) {
    console.error("Pricing page fetch error:", err);
  }

  return (
    <PricingClient
      initialProducts={products}
      initialSearch={searchParams?.search || ""}
    />
  );
}
