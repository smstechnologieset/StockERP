import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  code: z.string().optional().nullable(),
  category: z.string().min(1, "Please select or enter a category"),
  description: z.string().optional().nullable(),
  default_unit_id: z.string().min(1, "Default unit is required"),
  // Display pricing entered by user in terms of default unit
  cost_price_display: z.coerce.number().min(0, "Cost price cannot be negative"),
  selling_price_display: z.coerce.number().min(0, "Selling price cannot be negative"),
  reorder_threshold_display: z.coerce.number().min(0, "Reorder threshold cannot be negative"),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const unitSchema = z.object({
  name: z.string().min(2, "Unit name is required (e.g. 500g Pouch)"),
  symbol: z.string().min(1, "Symbol is required (e.g. pouch-500g)"),
  conversion_factor: z.coerce
    .number()
    .positive("Conversion factor must be greater than 0"),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
