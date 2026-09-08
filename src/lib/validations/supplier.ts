import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
