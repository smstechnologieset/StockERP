import { createClient } from "@/lib/supabase/server";
import { SuppliersClient } from "./SuppliersClient";
import type { Supplier } from "@/types/database";

export const revalidate = 0;

export default async function SuppliersPage() {
  let suppliers: Supplier[] = [];
  let isManager = true;

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

    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      suppliers = data;
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error);
  }

  // Fallback demo suppliers for initial preview
  const initialSuppliers: Supplier[] = suppliers.length > 0 ? suppliers : [
    {
      id: "sup-1",
      name: "Arsi Bale Farmers Grain Cooperative",
      contact_person: "Ato Tadesse Gemeda",
      phone: "+251 911 234567",
      address: "Bale Robe, Oromia",
      notes: "Primary supplier of Grade A Sinde (Wheat) and Barley",
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
      notes: "Supplier of raw sundried red peppers and whole spices for Berbere",
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "sup-3",
      name: "Gojjam Teff & Pulse Farmers",
      contact_person: "Ato Mulugeta Assefa",
      phone: "+251 933 456789",
      address: "Debre Markos, Amhara",
      notes: "High quality Ater (Split Yellow Peas) and pulses",
      is_active: true,
      created_at: "",
      updated_at: "",
    },
  ];

  return (
    <SuppliersClient
      initialSuppliers={initialSuppliers}
      isManager={isManager}
    />
  );
}
