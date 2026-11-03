import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name is required.").max(160),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.coerce.boolean().optional().default(true),
});
export type SupplierInput = z.infer<typeof supplierSchema>;
