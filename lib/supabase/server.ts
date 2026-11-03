import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server Supabase client bound to the request cookies.
 * Respects RLS using the signed-in admin's session (or anon for guests).
 * Use this in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseConfig();

  const client = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` is called from a Server Component where mutating cookies
          // is not allowed. The session is refreshed in middleware instead,
          // so this can be safely ignored.
        }
      },
    },
  });

  // Normalise to the supabase-js client type (the @supabase/ssr return has a
  // slightly different generic arity which otherwise resolves tables to never).
  return client as unknown as TypedSupabaseClient;
}
