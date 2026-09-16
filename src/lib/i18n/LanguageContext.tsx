"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language } from "./translations";
import { formatEthiopianDate, formatEthiopianDateTime, type FormatEthiopianDateOptions } from "../ethiopianDate";

export const CATEGORY_MAP: Record<string, { en: string; am: string }> = {
  "Whole Grains": { en: "Whole Grains", am: "ጥራጥሬዎችና እህሎች" },
  "Grains": { en: "Grains", am: "እህሎች" },
  "Powders & Spices": { en: "Powders & Spices", am: "የተፈጩ ዱቄቶችና ቅመሞች" },
  "Spices": { en: "Spices", am: "ቅመሞች" },
  "Edible Oils & Liquids": { en: "Edible Oils & Liquids", am: "የምግብ ዘይትና ፈሳሾች" },
  "Edible Oils": { en: "Edible Oils", am: "የምግብ ዘይትና ፈሳሾች" },
  "Packaged Goods & Provisions": { en: "Packaged Goods & Provisions", am: "የታሸጉ ዕቃዎች" },
  "Packaged Goods": { en: "Packaged Goods", am: "የታሸጉ ዕቃዎች" },
  "Pulses / Legumes": { en: "Pulses / Legumes", am: "አተርና ባቄላ" },
  "Pulses": { en: "Pulses", am: "አተርና ባቄላ" },
  "Legumes": { en: "Legumes", am: "አተርና ባቄላ" },
  "Flour / Milling": { en: "Flour / Milling", am: "የወፍጮ ውጤቶች" },
  "Flour": { en: "Flour", am: "የወፍጮ ውጤቶች" },
  "Other": { en: "Other", am: "ሌሎች" },
};

export function translateCategory(category: string, isAmharic: boolean): string {
  if (!category) return "";
  const trimmed = category.trim();
  const matched = CATEGORY_MAP[trimmed];
  if (matched) {
    return isAmharic ? matched.am : matched.en;
  }
  // Check case-insensitive match
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) {
      return isAmharic ? val.am : val.en;
    }
  }
  // Check partial match
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(trimmed.toLowerCase())) {
      return isAmharic ? val.am : val.en;
    }
  }
  return category;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  tCategory: (category: string) => string;
  formatEthDate: (input: string | Date | number | null | undefined, options?: FormatEthiopianDateOptions) => string;
  formatEthDateTime: (input: string | Date | number | null | undefined) => string;
  isAmharic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("stockerp_lang") as Language;
    if (saved === "en" || saved === "am") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("stockerp_lang", lang);
    } catch (e) {
      console.warn("Could not persist language to localStorage", e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "am" : "en");
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] as Record<string, string>;
    if (dict && dict[key]) {
      return dict[key];
    }
    const enDict = translations.en as Record<string, string>;
    return enDict[key] || fallback || key;
  };

  const tCategory = (category: string): string => {
    return translateCategory(category, language === "am");
  };

  const formatEthDate = (
    input: string | Date | number | null | undefined,
    options: FormatEthiopianDateOptions = {}
  ): string => {
    return formatEthiopianDate(input, { ...options, isAmharic: language === "am" });
  };

  const formatEthDateTime = (input: string | Date | number | null | undefined): string => {
    return formatEthiopianDateTime(input, { isAmharic: language === "am" });
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        tCategory,
        formatEthDate,
        formatEthDateTime,
        isAmharic: language === "am",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      tCategory: (category: string) => category,
      formatEthDate: (input: string | Date | number | null | undefined, options: FormatEthiopianDateOptions = {}) =>
        formatEthiopianDate(input, { ...options, isAmharic: false }),
      formatEthDateTime: (input: string | Date | number | null | undefined) =>
        formatEthiopianDateTime(input, { isAmharic: false }),
      isAmharic: false,
    };
  }
  return context;
}
