"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wheat,
  LayoutDashboard,
  ShoppingCart,
  PackagePlus,
  Boxes,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCheck,
  CreditCard,
  ArrowLeftRight,
  Tag,
  UserCog,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SidebarProps {
  userRole?: "owner_manager" | "staff";
  userName?: string;
  userEmail?: string;
  branchName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  userRole = "staff",
  userName = "Staff Member",
  userEmail = "",
  branchName = "Main Branch",
  isOpen = false,
  onClose,
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
    { name: t("nav_reports"), href: "/reports", icon: BarChart3 },
    { name: t("nav_users"), href: "/users", icon: UserCog },
  ];

  const navItems = isManager ? managerNavItems : staffNavItems;
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  }

  function handleNavClick() {
    // On mobile, close the drawer when a nav link is tapped
    if (onClose) onClose();
  }

  return (
    <>
      {/* ── Mobile Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Panel ── */}
      <aside
        className={cn(
          // Base: fixed, full height, off-screen on mobile
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card shadow-sm",
          // Slide transition
          "transition-transform duration-300 ease-in-out",
          // Mobile: hidden by default, shown when isOpen
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b px-6 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20">
            <Wheat className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold tracking-tight text-foreground text-sm truncate">
              {t("app_title")}
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium truncate">{t("app_subtitle")}</p>
          </div>
          {/* Close button — only shown on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Indicator */}
        <div className="border-b px-4 py-2.5 bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("nav_users")}:</span>
          <Badge
            variant={isManager ? "warning" : "info"}
            className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5"
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
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
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
              disabled={isSigningOut}
              title={t("nav_sign_out")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Full-screen logout overlay */}
        {isSigningOut && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute h-16 w-16 rounded-full bg-red-500/20 animate-ping opacity-60" />
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30">
                <LogOut className="h-7 w-7" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-foreground font-semibold text-base mb-1">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <span>{isAmharic ? "ከመለያዎ በመውጣት ላይ..." : "Signing out..."}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAmharic ? "እባክዎ ትንሽ ይጠብቁ..." : "Please wait a moment..."}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
