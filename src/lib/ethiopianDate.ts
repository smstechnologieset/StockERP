/**
 * Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር / Ge'ez Calendar)
 * 
 * Provides mathematical conversion between Gregorian and Ethiopian dates
 * based on Julian Day Number (JDN) algorithms, supporting all 13 Ethiopian
 * months (12 months of 30 days + Pagume of 5/6 days) in Amharic and English.
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1 to 13
  day: number;   // 1 to 30 (or 1 to 5/6 in Pagume)
}

export interface EthiopianMonthInfo {
  index: number;
  am: string;
  en: string;
}

export const ETHIOPIAN_MONTHS: readonly EthiopianMonthInfo[] = [
  { index: 1, am: "መስከረም", en: "Meskerem" },
  { index: 2, am: "ጥቅምት", en: "Tikimt" },
  { index: 3, am: "ህዳር", en: "Hidar" },
  { index: 4, am: "ታህሳስ", en: "Tahsas" },
  { index: 5, am: "ጥር", en: "Tir" },
  { index: 6, am: "የካቲት", en: "Yakatit" },
  { index: 7, am: "መጋቢት", en: "Magabit" },
  { index: 8, am: "ሚያዝያ", en: "Miyazya" },
  { index: 9, am: "ግንቦት", en: "Ginbot" },
  { index: 10, am: "ሰኔ", en: "Sene" },
  { index: 11, am: "ሐምሌ", en: "Hamle" },
  { index: 12, am: "ነሐሴ", en: "Nehase" },
  { index: 13, am: "ጳጉሜ", en: "Pagume" },
] as const;

/**
 * Converts a Gregorian date (year, month 1-12, day 1-31) to Julian Day Number (JDN).
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Converts a Julian Day Number (JDN) to an Ethiopian Date (year, month 1-13, day 1-30).
 * Ethiopian Epoch (Meskerem 1, Year 1 E.C.) corresponds to JDN 1723856.
 */
export function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const eyear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const emonth = Math.floor(n / 30) + 1;
  const eday = (n % 30) + 1;
  return { year: eyear, month: emonth, day: eday };
}

interface ParsedDate {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

function parseDateInput(input: string | Date | number): ParsedDate {
  if (typeof input === "string") {
    // If pure YYYY-MM-DD
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
        hours: match[4] ? parseInt(match[4], 10) : 0,
        minutes: match[5] ? parseInt(match[5], 10) : 0,
      };
    }
  }

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hours: now.getHours(),
      minutes: now.getMinutes(),
    };
  }

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
}

/**
 * Converts any date input to Ethiopian date components.
 */
export function toEthiopianDate(input: string | Date | number): EthiopianDate {
  const parsed = parseDateInput(input);
  const jdn = gregorianToJDN(parsed.year, parsed.month, parsed.day);
  return jdnToEthiopian(jdn);
}

export interface FormatEthiopianDateOptions {
  isAmharic?: boolean;
  includeTime?: boolean;
  includeYear?: boolean;
  monthOnly?: boolean;
}

/**
 * Formats a date into Ethiopian calendar with localized month names.
 * Example (Amharic): "መስከረም 14, 2017" or "መስከረም 14, 2017 11:46"
 * Example (English): "Meskerem 14, 2017" or "Meskerem 14, 2017 11:46"
 */
export function formatEthiopianDate(
  input: string | Date | number | null | undefined,
  options: FormatEthiopianDateOptions = {}
): string {
  if (!input) return "";
  const { isAmharic = true, includeTime = false, includeYear = true, monthOnly = false } = options;

  try {
    const parsed = parseDateInput(input);
    const eth = toEthiopianDate(input);
    const mInfo = ETHIOPIAN_MONTHS[eth.month - 1] || ETHIOPIAN_MONTHS[0];
    const monthName = isAmharic ? mInfo.am : mInfo.en;

    if (monthOnly) {
      return monthName;
    }

    let result = `${monthName} ${eth.day}`;
    if (includeYear) {
      result += `, ${eth.year}`;
    }

    if (includeTime) {
      const hh = String(parsed.hours).padStart(2, "0");
      const mm = String(parsed.minutes).padStart(2, "0");
      result += ` ${hh}:${mm}`;
    }

    return result;
  } catch (err) {
    return String(input);
  }
}

/**
 * Formats a date and time in Ethiopian calendar.
 */
export function formatEthiopianDateTime(
  input: string | Date | number | null | undefined,
  options: Omit<FormatEthiopianDateOptions, "includeTime"> = {}
): string {
  return formatEthiopianDate(input, { ...options, includeTime: true });
}

/**
 * Returns today's Ethiopian date object and formatted string.
 */
export function getEthiopianToday(isAmharic: boolean = true) {
  const now = new Date();
  const eth = toEthiopianDate(now);
  const formatted = formatEthiopianDate(now, { isAmharic });
  return {
    ...eth,
    formatted,
  };
}

/**
 * Converts an Ethiopian date to Julian Day Number (JDN).
 */
export function ethiopianToJDN(year: number, month: number, day: number): number {
  return 1723856 + 365 * year + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

/**
 * Converts a Julian Day Number (JDN) to Gregorian date components.
 */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const j = jdn + 32044;
  const g = Math.floor(j / 146097);
  const dg = j % 146097;
  const c = Math.floor(((Math.floor(dg / 36524) + 1) * 3) / 4);
  const dc = dg - c * 36524;
  const b = Math.floor(dc / 1461);
  const db = dc % 1461;
  const a = Math.floor(((Math.floor(db / 365) + 1) * 3) / 4);
  const da = db - a * 365;
  const y = g * 400 + c * 100 + b * 4 + a;
  const m = Math.floor((da * 5 + 308) / 153) - 2;
  const d = da - Math.floor(((m + 4) * 153) / 5) + 122;
  const Y = y - 4800 + Math.floor((m + 2) / 12);
  const M = ((m + 2) % 12) + 1;
  const D = d + 1;
  return { year: Y, month: M, day: D };
}

/**
 * Converts Ethiopian date components directly to Gregorian date components.
 */
export function ethiopianToGregorian(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const jdn = ethiopianToJDN(year, month, day);
  return jdnToGregorian(jdn);
}

/**
 * Converts Ethiopian date components directly to ISO date string (YYYY-MM-DD).
 */
export function ethiopianToGregorianDateString(year: number, month: number, day: number): string {
  const g = ethiopianToGregorian(year, month, day);
  return `${String(g.year).padStart(4, "0")}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
}

/**
 * Checks if an Ethiopian year is a leap year (where Pagume has 6 days).
 */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3;
}

/**
 * Gets total days in an Ethiopian month (30 for months 1-12, 5 or 6 for Pagume).
 */
export function getEthiopianMonthDays(year: number, month: number): number {
  if (month >= 1 && month <= 12) return 30;
  if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5;
  return 30;
}

/**
 * Gets the day of week for the 1st day of an Ethiopian month.
 * Returns 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getEthiopianMonthFirstDayOfWeek(year: number, month: number): number {
  const jdn = ethiopianToJDN(year, month, 1);
  return (jdn + 1) % 7;
}

export interface EthiopianWeekdayInfo {
  index: number;
  am: string;
  en: string;
  shortAm: string;
  shortEn: string;
}

export const ETHIOPIAN_WEEKDAYS: readonly EthiopianWeekdayInfo[] = [
  { index: 0, am: "እሑድ", en: "Sun", shortAm: "እሑ", shortEn: "Su" },
  { index: 1, am: "ሰኞ", en: "Mon", shortAm: "ሰኞ", shortEn: "Mo" },
  { index: 2, am: "ማክሰኞ", en: "Tue", shortAm: "ማክ", shortEn: "Tu" },
  { index: 3, am: "ረቡዕ", en: "Wed", shortAm: "ረቡ", shortEn: "We" },
  { index: 4, am: "ሐሙስ", en: "Thu", shortAm: "ሐሙ", shortEn: "Th" },
  { index: 5, am: "ዓርብ", en: "Fri", shortAm: "ዓር", shortEn: "Fr" },
  { index: 6, am: "ቅዳሜ", en: "Sat", shortAm: "ቅዳ", shortEn: "Sa" },
] as const;

