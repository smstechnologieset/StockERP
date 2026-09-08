"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wheat,
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  Boxes,
  Users,
  BarChart3,
  Scale,
  Building2,
  LogOut,
  ShieldCheck,
  UserCheck,
  CreditCard,
  ArrowLeftRight,
  Tag,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SidebarProps {
  userRole?: "owner_manager" | "staff";
  userName?: string;
  userEmail?: string;
  branchName?: string;
}

export function Sidebar({
  userRole = "staff",
  userName = "Staff Member",
  userEmail = "staff@stockerp.et",
  branchName = "Main Branch",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t, isAmharic } = useLanguage();

  const isManager = userRole === "owner_manager";

  const staffNavItems = [
    { name: t("nav_staff_dashboard"), href: "/staff", icon: LayoutDashboard },
    { name: t("nav_pos"), href: "/sales/new", icon: ShoppingCart },
    { name: t("nav_receive_stock"), href: "/purchases/new", icon: PackagePlus },
    { name: t("nav_inventory"), href: "/inventory", icon: Boxes },
    { name: t("nav_credit"), href: "/credit", icon: CreditCard },
  ];

  const managerNavItems = [
    { name: t("nav_manager_dashboard"), href: "/manager", icon: LayoutDashboard },
    { name: t("nav_point_of_sale"), href: "/sales/new", icon: ShoppingCart },
    { name: t("nav_receive_stock"), href: "/purchases/new", icon: PackagePlus },
    { name: t("nav_inventory_ledger"), href: "/inventory", icon: Boxes },
    { name: t("nav_inbound_outbound"), href: "/inventory/movements", icon: ArrowLeftRight },
    { name: t("nav_credit"), href: "/credit", icon: CreditCard },
    { name: t("nav_products"), href: "/products", icon: Wheat },
    { name: t("nav_pricing"), href: "/products/pricing", icon: Tag },
    { name: t("nav_suppliers"), href: "/suppliers", icon: Users },
    { name: t("nav_units"), href: "/units", icon: Scale },
    { name: t("nav_reports"), href: "/reports", icon: BarChart3 },
    { name: t("nav_users"), href: "/users", icon: UserCog },
  ];

  const navItems = isManager ? managerNavItems : staffNavItems;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-card shadow-sm transition-all">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20">
          <Wheat className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-heading font-bold tracking-tight text-foreground text-sm">
            {t("app_title")}
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">{t("app_subtitle")}</p>
        </div>
      </div>

      {/* Branch & Role Indicator */}
      <div className="border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-medium text-foreground">{branchName === "Main Branch" ? t("main_branch") : branchName}</span>
          </div>
          <Badge
            variant={isManager ? "warning" : "info"}
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0"
          >
            {isManager ? (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> {t("owner_manager")}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> {t("staff")}
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("nav_navigation")}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-muted-foreground")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="border-t p-3 bg-card">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-300">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title={t("nav_sign_out")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
