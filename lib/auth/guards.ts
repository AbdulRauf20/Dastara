import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ROLE_CAPABILITIES,
  type AdminRole,
  type Capability,
} from "@/lib/constants";
import type { AdminProfileRow } from "@/types/database";

export interface AdminSession {
  userId: string;
  email: string;
  profile: AdminProfileRow;
}

/**
 * Returns the current admin session or null. Authorization is established on
 * the server from the Supabase session + the admin_profiles table. We never
 * trust client-provided roles.
 */
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) return null;
  return { userId: user.id, email: user.email ?? profile.email, profile };
}

/** Require any active admin; redirect to login otherwise. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}

/** True if the role has the given capability. */
export function roleCan(role: AdminRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role][capability] === true;
}

/** Require a specific capability; redirect to the dashboard if lacking it. */
export async function requireCapability(
  capability: Capability,
): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!roleCan(session.profile.role, capability)) {
    redirect("/admin?denied=1");
  }
  return session;
}

/** Non-redirecting capability check for use inside server actions. */
export async function assertCapability(
  capability: Capability,
): Promise<AdminSession> {
  const session = await getCurrentAdmin();
  if (!session) throw new Error("Not authenticated.");
  if (!roleCan(session.profile.role, capability)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session;
}
