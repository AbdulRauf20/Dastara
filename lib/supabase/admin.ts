import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getServiceRoleKey } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * SECURITY: Only import this from trusted server code after you have already
 * authenticated and authorized the caller. Never expose it to the browser.
 * `import "server-only"` makes a client bundle import a hard build error.
 *
 * Intended uses: provisioning admin auth users, privileged maintenance, and
 * reading storage internals. Prefer the RLS-bound server client for everything
 * that can run under the admin's own session.
 */
export function createAdminClient() {
  const { url } = getPublicSupabaseConfig();
  return createSupabaseClient<Database>(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
