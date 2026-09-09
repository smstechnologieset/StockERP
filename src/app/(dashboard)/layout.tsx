import { Sidebar } from "@/components/navigation/Sidebar";
import { Navbar } from "@/components/navigation/Navbar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userRole: "owner_manager" | "staff" = "owner_manager";
  let userName = "Abebe Kebede";
  let userEmail = "manager@stockerp.et";
  let branchName = "Main Branch";
  let lowStockCount = 0;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || userEmail;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile) {
        userName = profile.full_name || userName;
        userRole = profile.role || userRole;
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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        branchName={branchName}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64 transition-all">
        <Navbar userRole={userRole} lowStockCount={lowStockCount} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
