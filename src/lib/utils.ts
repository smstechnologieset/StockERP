import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS class names with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into Ethiopian Birr (ETB)
 * Example: formatETB(15420.5) => "ETB 15,420.50"
 */
export function formatETB(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "ETB 0.00";
  }
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("ETB", "ETB ");
}

/**
 * Converts any entered quantity to the storage base unit (Grams)
 * Example: 2.5 quintals (factor 100,000) => 250,000 grams
 */
export function toBaseUnits(quantity: number, conversionFactor: number): number {
  if (!quantity || !conversionFactor) return 0;
  return Number((quantity * conversionFactor).toFixed(3));
}

/**
 * Converts grams into a human display unit
 * Example: 250,000 grams / 100,000 (quintal) => 2.5 quintals
 */
export function fromBaseUnits(grams: number, conversionFactor: number): number {
  if (!grams || !conversionFactor) return 0;
  return Number((grams / conversionFactor).toFixed(3));
}

/**
 * Cleanly formats numeric quantities with up to 3 decimal places
 */
export function formatQuantity(qty: number | null | undefined, symbol: string = ""): string {
  if (qty === null || qty === undefined || isNaN(qty)) return `0 ${symbol}`.trim();
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(qty);
  return symbol ? `${formatted} ${symbol}` : formatted;
}
