import { z } from "zod";

export const saleItemSchema = z.object({
  product_id: z.string().min(1, "Please select a product"),
  unit_id: z.string().min(1, "Please select a unit"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_price: z.coerce.number().min(0, "Unit price cannot be negative"),
});

export const saleSchema = z.object({
  branch_id: z.string().default("00000000-0000-0000-0000-000000000001"),
  customer_name: z.string().default("Walk-in Customer"),
  customer_phone: z.string().optional().nullable(),
  payment_method: z.enum(["cash", "telebirr", "cbe_birr", "bank_transfer", "credit"]).default("cash"),
  notes: z.string().optional().nullable(),
  manual_override: z.boolean().default(false),
  override_reason: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "Please add at least one line item"),
}).refine(
  (data) => {
    if (data.manual_override && (!data.override_reason || data.override_reason.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "An explicit reason is mandatory when manually overriding stock limits.",
    path: ["override_reason"],
  }
);

export type SaleFormValues = z.infer<typeof saleSchema>;
export type SaleItemFormValues = z.infer<typeof saleItemSchema>;
