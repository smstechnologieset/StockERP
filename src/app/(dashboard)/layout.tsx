import { Suspense } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";
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

      // Check low stock count from view
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
    <div className="flex min-h-screen bg-background text-foreground print:bg-white print:text-black">
      {/* Navigation Progress bar on route changes */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {/* Sidebar navigation */}
      <div className="print:hidden">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          branchName={branchName}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64 transition-all print:pl-0">
        <div className="print:hidden">
          <Navbar userRole={userRole} lowStockCount={lowStockCount} />
        </div>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
