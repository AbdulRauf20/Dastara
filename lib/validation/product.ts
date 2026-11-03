import { z } from "zod";
import { AVAILABILITY } from "@/lib/constants";

const availabilityValues = Object.values(AVAILABILITY) as [string, ...string[]];

/** Rupee input (decimal allowed) -> we convert to paisa in the action. */
const rupees = z.coerce
  .number({ invalid_type_error: "Enter a valid amount." })
  .min(0, "Amount cannot be negative.")
  .max(100_000_000, "Amount is too large.");

const optionalRupees = z
  .union([rupees, z.literal("").transform(() => null), z.null()])
  .optional();

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required.").max(160),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and hyphens.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  availability: z.enum(availabilityValues),
  isPublished: z.coerce.boolean().optional().default(false),

  price: rupees,
  originalPrice: optionalRupees,

  material: z.string().trim().max(200).optional().or(z.literal("")),
  dimensions: z.string().trim().max(200).optional().or(z.literal("")),
  color: z.string().trim().max(120).optional().or(z.literal("")),
  careInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  originNote: z.string().trim().max(1000).optional().or(z.literal("")),
  originVerified: z.coerce.boolean().optional().default(false),

  isTrending: z.coerce.boolean().optional().default(false),
  trendingOrder: z.coerce.number().int().optional().nullable(),
  isFeatured: z.coerce.boolean().optional().default(false),
  featuredOrder: z.coerce.number().int().optional().nullable(),
  isNewArrival: z.coerce.boolean().optional().default(false),
  newArrivalOrder: z.coerce.number().int().optional().nullable(),
  displayOrder: z.coerce.number().int().optional().default(0),

  // Private — admin only.
  supplierCost: optionalRupees,
  packagingCost: optionalRupees,
  deliveryCost: optionalRupees,
  internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
