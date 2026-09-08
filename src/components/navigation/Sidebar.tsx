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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

  const isManager = userRole === "owner_manager";

  const staffNavItems = [
    { name: "Staff Dashboard", href: "/staff", icon: LayoutDashboard },
    { name: "Record Sale (POS)", href: "/sales/new", icon: ShoppingCart },
    { name: "Receive Stock", href: "/purchases/new", icon: PackagePlus },
    { name: "Current Stock", href: "/inventory", icon: Boxes },
  ];

  const managerNavItems = [
    { name: "Manager Dashboard", href: "/manager", icon: LayoutDashboard },
    { name: "Point of Sale", href: "/sales/new", icon: ShoppingCart },
    { name: "Receive Stock", href: "/purchases/new", icon: PackagePlus },
    { name: "Inventory Ledger", href: "/inventory", icon: Boxes },
    { name: "Products & Pricing", href: "/products", icon: Wheat },
    { name: "Suppliers", href: "/suppliers", icon: Users },
    { name: "Units & Conversion", href: "/units", icon: Scale },
    { name: "Reports & Valuation", href: "/reports", icon: BarChart3 },
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
          <h1 className="font-heading font-bold tracking-tight text-foreground text-base">
            Grain & Powder
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Addis Trading ERP</p>
        </div>
      </div>

      {/* Branch & Role Indicator */}
      <div className="border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-medium text-foreground">{branchName}</span>
          </div>
          <Badge
            variant={isManager ? "warning" : "info"}
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0"
          >
            {isManager ? (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Owner / Manager
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Staff
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Navigation
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
            title="Sign Out"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
