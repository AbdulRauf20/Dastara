import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required.").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and hyphens.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().optional().default(0),
  isVisible: z.coerce.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
