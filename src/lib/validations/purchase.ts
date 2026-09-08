import { z } from "zod";

export const purchaseItemSchema = z.object({
  product_id: z.string().min(1, "Please select a product"),
  unit_id: z.string().min(1, "Please select a unit"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
});

export const purchaseSchema = z.object({
  branch_id: z.string().default("00000000-0000-0000-0000-000000000001"),
  supplier_id: z.string().min(1, "Please select a supplier"),
  purchase_date: z.string().default(() => new Date().toISOString().split("T")[0]),
  invoice_reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "Please add at least one line item"),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
export type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;
