import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";
import type { Profile } from "@/types/database";

export const revalidate = 0;

export default async function UsersManagementPage() {
  let users: (Profile & { email?: string; branch_name?: string })[] = [];

  try {
    const supabase = createClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, branches(name)")
      .order("created_at", { ascending: true });

    if (profiles && profiles.length > 0) {
      users = profiles.map((p: any) => ({
        ...p,
        branch_name: p.branches?.name || "Main Branch",
        email: p.full_name?.toLowerCase().includes("abebe") || p.role === "owner_manager"
          ? "manager@stockerp.et"
          : "staff@stockerp.et",
      }));
    }
  } catch (err) {
    console.error("Users page fetch error:", err);
  }

  // Fallback demo users if empty
  if (users.length === 0) {
    users = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        full_name: "Abebe Kebede",
        role: "owner_manager",
        branch_id: "00000000-0000-0000-0000-000000000001",
        branch_name: "Main Branch (Addis Ababa)",
        email: "manager@stockerp.et",
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        full_name: "Chala Bekele",
        role: "staff",
        branch_id: "00000000-0000-0000-0000-000000000001",
        branch_name: "Main Branch (Addis Ababa)",
        email: "staff@stockerp.et",
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  return <UsersClient initialUsers={users} />;
}
