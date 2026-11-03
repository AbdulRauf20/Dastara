"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { newsletterSchema } from "@/lib/validation/order";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function subscribeNewsletter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getClientIp();
  const limit = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.ok) return fail("Too many attempts. Please try again shortly.");

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    return fail("Please enter a valid email address.");
  }
  // Honeypot
  if (parsed.data.website) return ok(undefined, "Subscribed.");

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email: parsed.data.email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
    return ok(undefined, "Thank you — we'll be in touch with thoughtful updates.");
  } catch (err) {
    console.error("[newsletter] subscribe failed", err);
    return fail("Something went wrong. Please try again.");
  }
}
