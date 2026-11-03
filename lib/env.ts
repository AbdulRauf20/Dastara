/**
 * Centralised, validated environment access.
 *
 * Public vars are safe for the browser. Server-only vars (service role) are
 * read lazily and must never be imported into client components.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example for setup instructions.`,
    );
  }
  return value;
}

/** Public Supabase config — safe to use anywhere. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappFallback: process.env.NEXT_PUBLIC_WHATSAPP_FALLBACK ?? "",
};

/** Assert public Supabase config is present (used by client factories). */
export function getPublicSupabaseConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey),
  };
}

/**
 * Service-role key. SERVER ONLY. Throws if accidentally evaluated in the
 * browser, and never read unless explicitly requested by trusted server code.
 */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be used in the browser.");
  }
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
