"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS,
  toEthiopianDate,
  formatEthiopianDate,
  getEthiopianToday,
  getEthiopianMonthDays,
  getEthiopianMonthFirstDayOfWeek,
  ethiopianToGregorianDateString,
  type EthiopianDate,
} from "@/lib/ethiopianDate";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface EthiopianDatePickerProps {
  value?: string; // Gregorian date string YYYY-MM-DD
  onChange: (gregorianDateString: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
}

export function EthiopianDatePicker({
  value,
  onChange,
  id,
  placeholder,
  disabled = false,
  className = "",
  min,
  max,
}: EthiopianDatePickerProps) {
  const { isAmharic, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today in Ethiopian calendar
  const todayEth = useMemo(() => getEthiopianToday(isAmharic), [isAmharic]);

  // Selected date in Ethiopian calendar
  const selectedEth = useMemo<EthiopianDate | null>(() => {
    if (!value) return null;
    try {
      return toEthiopianDate(value);
    } catch {
      return null;
    }
  }, [value]);

  // View state for calendar navigation (Year & Month)
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedEth ? selectedEth.year : todayEth.year;
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedEth ? selectedEth.month : todayEth.month;
  });

  // When value changes from outside, sync viewYear/viewMonth
  useEffect(() => {
    if (selectedEth) {
      setViewYear(selectedEth.year);
      setViewMonth(selectedEth.month);
    }
  }, [selectedEth]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Navigate to previous Ethiopian month
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(13);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  // Navigate to next Ethiopian month
  const handleNextMonth = () => {
    if (viewMonth === 13) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select a day
  const handleSelectDay = (dayNumber: number) => {
    const gregStr = ethiopianToGregorianDateString(viewYear, viewMonth, dayNumber);
    onChange(gregStr);
    setIsOpen(false);
  };

  // Select Today
  const handleSelectToday = () => {
    const gregStr = ethiopianToGregorianDateString(todayEth.year, todayEth.month, todayEth.day);
    onChange(gregStr);
    setViewYear(todayEth.year);
    setViewMonth(todayEth.month);
    setIsOpen(false);
  };

  // Compute month layout
  const totalDays = useMemo(() => {
    return getEthiopianMonthDays(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return getEthiopianMonthFirstDayOfWeek(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // List of selectable Ethiopian years (e.g. 2012 to 2026 E.C.)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const base = todayEth.year;
    for (let y = base - 6; y <= base + 5; y++) {
      years.push(y);
    }
    return years;
  }, [todayEth.year]);

  // Display text in input trigger
  const displayLabel = useMemo(() => {
    if (!value) {
      return placeholder || (isAmharic ? "ቀን ይምረጡ..." : "Select date...");
    }
    return formatEthiopianDate(value, { isAmharic });
  }, [value, placeholder, isAmharic]);

  const activeMonthInfo = ETHIOPIAN_MONTHS[viewMonth - 1] || ETHIOPIAN_MONTHS[0];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button styled like an Input */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 w-full min-w-[155px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm transition-all hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? "ring-2 ring-amber-600/30 border-amber-600" : ""
        }`}
      >
        <span className="flex items-center gap-2 truncate font-medium">
          <CalendarIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-[285px] rounded-xl border border-border bg-card p-3 shadow-2xl backdrop-blur animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-border/60">
            {/* Prev Month */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              title={isAmharic ? "ቀዳሚ ወር" : "Previous Month"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Month & Year Dropdown Selectors */}
            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="h-7 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                {ETHIOPIAN_MONTHS.map((m) => (
                  <option key={m.index} value={m.index}>
                    {isAmharic ? m.am : m.en}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="h-7 rounded-md border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y} {isAmharic ? "ዓ.ም" : "E.C."}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Month */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              title={isAmharic ? "ቀጣይ ወር" : "Next Month"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday Label Row */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
            {ETHIOPIAN_WEEKDAYS.map((w) => (
              <div
                key={w.index}
                className="text-[10px] font-semibold text-muted-foreground uppercase"
                title={isAmharic ? w.am : w.en}
              >
                {isAmharic ? w.shortAm : w.shortEn}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 py-1">
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {/* Month Day Buttons */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedEth?.year === viewYear &&
                selectedEth?.month === viewMonth &&
                selectedEth?.day === day;
              const isToday =
                todayEth.year === viewYear &&
                todayEth.month === viewMonth &&
                todayEth.day === day;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors flex items-center justify-center relative ${
                    isSelected
                      ? "bg-amber-600 text-white font-bold shadow-sm"
                      : isToday
                      ? "border border-amber-600/70 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/15"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-amber-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Shortcuts */}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border/60 text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              📅 {isAmharic ? `ዛሬ (${formatEthiopianDate(new Date(), { isAmharic: true, includeYear: false })})` : "Today"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              {isAmharic ? "ዝጋ" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
