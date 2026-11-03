"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

/**
 * Admin sign-in. Authenticates via Supabase Auth, then verifies the user has an
 * active admin profile. Non-admins are immediately signed out — a valid auth
 * user is NOT sufficient to access the admin area.
 */
export async function signIn(
  _prev: ActionResult<{ redirect: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirect: string }>> {
  const ip = await getClientIp();
  const limit = rateLimit(`login:${ip}`, 8, 5 * 60_000);
  if (!limit.ok) {
    return fail("Too many login attempts. Please wait a few minutes and try again.");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirect: formData.get("redirect") ?? undefined,
  });
  if (!parsed.success) {
    return fail("Enter a valid email and password (min 8 characters).");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return fail("Invalid email or password.");
  }

  // Verify active admin profile.
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return fail("This account is not authorized to access the admin area.");
  }

  await logAudit({
    actorId: data.user.id,
    actorEmail: data.user.email ?? parsed.data.email,
    action: "admin.login",
  });

  const dest =
    parsed.data.redirect && parsed.data.redirect.startsWith("/admin")
      ? parsed.data.redirect
      : "/admin";
  return ok({ redirect: dest });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email ?? null,
      action: "admin.logout",
    });
  }
  await supabase.auth.signOut();
  redirect("/admin/login");
}
