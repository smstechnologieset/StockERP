import { Suspense } from "react";
import { DashboardShell } from "@/components/navigation/DashboardShell";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userRole: "owner_manager" | "staff" = "staff";
  let userName = "User";
  let userEmail = "";
  let branchName = "Main Branch";
  let lowStockCount = 0;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        userName = profile.full_name || (user.email ? user.email.split("@")[0] : "User");
        userRole = profile.role || "staff";
      } else if (user.email) {
        userName = user.email.split("@")[0];
      }

      const { count } = await supabase
        .from("view_product_current_stock")
        .select("*", { count: "exact", head: true })
        .eq("is_low_stock", true);

      lowStockCount = count || 0;
    }
  } catch (error) {
    console.error("Dashboard layout auth fetch error:", error);
  }

  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <DashboardShell
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        branchName={branchName}
        lowStockCount={lowStockCount}
      >
        {children}
      </DashboardShell>
    </>
  );
}
