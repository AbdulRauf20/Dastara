import { z } from "zod";
import { normalizePkPhone } from "@/lib/phone";

const rupees = z.coerce.number().min(0).max(100_000_000);

export const settingsSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .refine((v) => normalizePkPhone(v) !== null, {
      message: "Enter a valid Pakistani WhatsApp number.",
    }),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  announcementText: z.string().trim().max(300).optional().or(z.literal("")),
  announcementEnabled: z.coerce.boolean().optional().default(true),
  heroHeadline: z.string().trim().max(160).optional().or(z.literal("")),
  heroSubtext: z.string().trim().max(400).optional().or(z.literal("")),
  heroCtaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  heroCtaHref: z.string().trim().max(200).optional().or(z.literal("")),
  socialInstagram: z.string().trim().max(200).optional().or(z.literal("")),
  socialFacebook: z.string().trim().max(200).optional().or(z.literal("")),
  socialTiktok: z.string().trim().max(200).optional().or(z.literal("")),
  deliveryFee: rupees,
  deliveryEstimate: z.string().trim().max(200).optional().or(z.literal("")),
  freeDeliveryThreshold: z
    .union([rupees, z.literal("").transform(() => null), z.null()])
    .optional(),
  footerAbout: z.string().trim().max(600).optional().or(z.literal("")),
  trendingEnabled: z.coerce.boolean().optional().default(true),
  trendingMax: z.coerce.number().int().min(1).max(24).optional().default(8),
  featuredEnabled: z.coerce.boolean().optional().default(true),
  newArrivalsEnabled: z.coerce.boolean().optional().default(true),
  showSoldOut: z.coerce.boolean().optional().default(true),
  // Policy content (configurable by admin).
  policyAbout: z.string().trim().max(5000).optional().or(z.literal("")),
  policyShipping: z.string().trim().max(5000).optional().or(z.literal("")),
  policyReturns: z.string().trim().max(5000).optional().or(z.literal("")),
  policyCare: z.string().trim().max(5000).optional().or(z.literal("")),
  policyPrivacy: z.string().trim().max(5000).optional().or(z.literal("")),
  policyTerms: z.string().trim().max(5000).optional().or(z.literal("")),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const paymentConfigSchema = z.object({
  paymentInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  bankDetails: z.string().trim().max(2000).optional().or(z.literal("")),
  easypaisaDetails: z.string().trim().max(2000).optional().or(z.literal("")),
  jazzcashDetails: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;
