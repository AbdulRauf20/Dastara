"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCapability } from "@/lib/auth/guards";
import { settingsSchema, paymentConfigSchema } from "@/lib/validation/settings";
import { ok, fail, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { rupeesToPaisa } from "@/lib/utils";
import { normalizePkPhone } from "@/lib/phone";
import { logAudit } from "@/lib/audit";

export async function updateSettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageSettings");
  } catch (e) {
    return fail((e as Error).message);
  }

  const raw = Object.fromEntries(formData.entries());
  // Normalize checkbox values ("on"/absent) to booleans the schema can coerce.
  const toBool = (k: string) => formData.get(k) === "on" || formData.get(k) === "true";
  const parsed = settingsSchema.safeParse({
    ...raw,
    announcementEnabled: toBool("announcementEnabled"),
    trendingEnabled: toBool("trendingEnabled"),
    featuredEnabled: toBool("featuredEnabled"),
    newArrivalsEnabled: toBool("newArrivalsEnabled"),
    showSoldOut: toBool("showSoldOut"),
  });
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;

  const whatsapp = normalizePkPhone(d.whatsappNumber);
  if (!whatsapp) return fail("Enter a valid WhatsApp number.", { whatsappNumber: ["Invalid number."] });

  const policies: Record<string, string> = {
    about: d.policyAbout ?? "",
    shipping: d.policyShipping ?? "",
    returns: d.policyReturns ?? "",
    care: d.policyCare ?? "",
    privacy: d.policyPrivacy ?? "",
    terms: d.policyTerms ?? "",
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      whatsapp_number: whatsapp,
      contact_email: d.contactEmail || null,
      contact_phone: d.contactPhone || null,
      announcement_text: d.announcementText || null,
      announcement_enabled: d.announcementEnabled ?? true,
      hero_headline: d.heroHeadline || null,
      hero_subtext: d.heroSubtext || null,
      hero_cta_label: d.heroCtaLabel || null,
      hero_cta_href: d.heroCtaHref || null,
      social_instagram: d.socialInstagram || null,
      social_facebook: d.socialFacebook || null,
      social_tiktok: d.socialTiktok || null,
      delivery_fee_paisa: rupeesToPaisa(d.deliveryFee),
      delivery_estimate: d.deliveryEstimate || null,
      free_delivery_threshold_paisa:
        d.freeDeliveryThreshold == null ? null : rupeesToPaisa(d.freeDeliveryThreshold),
      footer_about: d.footerAbout || null,
      trending_enabled: d.trendingEnabled ?? true,
      trending_max: d.trendingMax ?? 8,
      featured_enabled: d.featuredEnabled ?? true,
      new_arrivals_enabled: d.newArrivalsEnabled ?? true,
      show_sold_out: d.showSoldOut ?? true,
      policies,
      updated_by: session.userId,
    } as never)
    .eq("id", 1);

  if (error) return fail("Could not save settings.");
  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "settings.update",
    entityType: "site_settings",
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return ok(undefined, "Settings saved.");
}

export async function updatePaymentConfig(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageSettings");
  } catch (e) {
    return fail((e as Error).message);
  }
  const parsed = paymentConfigSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_config")
    .update({
      payment_instructions: d.paymentInstructions || null,
      bank_details: d.bankDetails || null,
      easypaisa_details: d.easypaisaDetails || null,
      jazzcash_details: d.jazzcashDetails || null,
      updated_by: session.userId,
    } as never)
    .eq("id", 1);

  if (error) return fail("Could not save payment configuration.");
  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "payment_config.update",
    entityType: "payment_config",
  });
  revalidatePath("/admin/settings");
  return ok(undefined, "Payment configuration saved.");
}
