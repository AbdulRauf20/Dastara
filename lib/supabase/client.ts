"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client. Uses the public anon key only; every query is
 * constrained by Row Level Security. Never put privileged logic here.
 */
export function createClient(): SupabaseClient<Database> {
  const { url, anonKey } = getPublicSupabaseConfig();
  const client = createBrowserClient<Database>(url, anonKey);
  return client as unknown as SupabaseClient<Database>;
}
