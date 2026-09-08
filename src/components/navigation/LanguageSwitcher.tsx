"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-1.5 border-amber-600/30 text-xs font-semibold hover:bg-amber-500/10 hover:border-amber-600/60 transition-all text-foreground"
      title={language === "en" ? "Switch to አማርኛ" : "Switch to English"}
    >
      <Globe className="h-3.5 w-3.5 text-amber-600" />
      <span>{language === "en" ? "🇪🇹 አማርኛ" : "🇬🇧 English"}</span>
    </Button>
  );
}
