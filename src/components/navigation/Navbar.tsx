"use client";

import Link from "next/link";
import { Plus, ShoppingCart, PackagePlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface NavbarProps {
  userRole?: "owner_manager" | "staff";
  lowStockCount?: number;
}

export function Navbar({ userRole = "staff", lowStockCount = 0 }: NavbarProps) {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          {t("app_title")} &bull; <span className="text-xs">{t("app_subtitle")}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Bilingual Language Switcher */}
        <LanguageSwitcher />

        {/* Low Stock Badge for quick glance */}
        {lowStockCount > 0 && (
          <Link href="/inventory?filter=low-stock">
            <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lowStockCount} {t("stock_low_stock_warning")}</span>
            </div>
          </Link>
        )}

        {/* Quick Action: New Sale */}
        <Link href="/sales/new">
          <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">{t("btn_new_sale")}</span>
          </Button>
        </Link>

        {/* Quick Action: Stock In */}
        <Link href="/purchases/new">
          <Button size="sm" variant="outline" className="gap-1.5 border-amber-600/30 text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40">
            <PackagePlus className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden xs:inline">{t("btn_stock_in")}</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
