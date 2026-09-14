import type { Unit } from "@/types/database";

export const STANDARD_UNITS: Unit[] = [
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Kilogram",
    symbol: "kg",
    conversion_factor: 1000.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Quintal (Kuntal)",
    symbol: "q",
    conversion_factor: 100000.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    name: "Liter",
    symbol: "L",
    conversion_factor: 1000.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    name: "50kg Sack",
    symbol: "sack-50kg",
    conversion_factor: 50000.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000011",
    name: "Bag / Sack",
    symbol: "bag",
    conversion_factor: 50000.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000008",
    name: "Piece / Item",
    symbol: "pcs",
    conversion_factor: 1.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000009",
    name: "Bottle",
    symbol: "btl",
    conversion_factor: 1.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000010",
    name: "Carton / Box",
    symbol: "ctn",
    conversion_factor: 1.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    name: "Packet",
    symbol: "pkt",
    conversion_factor: 1.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Gram",
    symbol: "g",
    conversion_factor: 1.0,
    is_base_unit: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000012",
    name: "Milliliter",
    symbol: "ml",
    conversion_factor: 1.0,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Milligram",
    symbol: "mg",
    conversion_factor: 0.001,
    is_base_unit: false,
    created_at: new Date().toISOString(),
  },
];

/**
 * Helper to ensure a unit list contains all standard trading units
 * without duplicating any existing symbols or IDs.
 */
export function mergeWithStandardUnits(units: Unit[] = []): Unit[] {
  const merged = [...units];
  for (const std of STANDARD_UNITS) {
    if (
      !merged.some(
        (u) =>
          u.id === std.id ||
          u.symbol.toLowerCase() === std.symbol.toLowerCase()
      )
    ) {
      merged.push(std);
    }
  }
  return merged;
}
