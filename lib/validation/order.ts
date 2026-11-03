import { z } from "zod";
import { normalizePkPhone } from "@/lib/phone";

/**
 * Public order-inquiry schema. Validated on the server. Note: price and
 * product details are NEVER taken from the client — only the product id and
 * quantity influence the server-side calculation.
 */
export const orderInquirySchema = z.object({
  productId: z.string().uuid("A valid product is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(99, "For larger orders, please message us on WhatsApp."),
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter your WhatsApp number.")
    .refine((v) => normalizePkPhone(v) !== null, {
      message: "Enter a valid Pakistani mobile number (e.g. 0345 3412201).",
    }),
  city: z.string().trim().min(2, "Please enter your city.").max(80),
  deliveryAddress: z
    .string()
    .trim()
    .min(10, "Please enter your complete delivery address.")
    .max(500),
  preferredVariant: z.string().trim().max(120).optional().or(z.literal("")),
  specialInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
  giftMessage: z.string().trim().max(500).optional().or(z.literal("")),
  // Honeypot: must stay empty. Bots tend to fill every field.
  website: z.string().max(0).optional(),
});

export type OrderInquiryInput = z.infer<typeof orderInquirySchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  website: z.string().max(0).optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;
