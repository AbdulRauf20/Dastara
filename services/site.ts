import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import type { SiteSettingsRow } from "@/types/database";

/** Sensible defaults so the storefront renders before settings are configured. */
export const DEFAULT_SETTINGS: SiteSettingsRow = {
  id: 1,
  whatsapp_number: publicEnv.whatsappFallback || "923453412201",
  contact_email: "hello@dastara.pk",
  contact_phone: null,
  announcement_text: "Handmade. Thoughtfully Found.",
  announcement_enabled: true,
  hero_headline: "Made by hand. Chosen with care.",
  hero_subtext:
    "Discover thoughtfully sourced handmade pieces that bring craftsmanship, culture, and character into everyday life.",
  hero_cta_label: "Explore Collection",
  hero_cta_href: "/shop",
  hero_image_path: null,
  social_instagram: null,
  social_facebook: null,
  social_tiktok: null,
  delivery_fee_paisa: 25000,
  delivery_estimate: "Typically delivered within 5–9 working days after payment verification.",
  free_delivery_threshold_paisa: null,
  footer_about:
    "DASTARA discovers handmade products from local artisans across Pakistan, beginning in interior Sindh.",
  trending_enabled: true,
  trending_max: 8,
  featured_enabled: true,
  new_arrivals_enabled: true,
  show_sold_out: true,
  sections: {},
  policies: {},
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

/** Fetch public site settings (falls back to defaults if unset/unavailable). */
export async function getSiteSettings(): Promise<SiteSettingsRow> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return data ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Resolve the effective business WhatsApp number. */
export function resolveWhatsappNumber(settings: SiteSettingsRow): string {
  return settings.whatsapp_number || publicEnv.whatsappFallback || "923453412201";
}
