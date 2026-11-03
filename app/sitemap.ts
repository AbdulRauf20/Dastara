import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/collections",
    "/about",
    "/contact",
    "/policies/shipping",
    "/policies/returns",
    "/policies/care",
    "/policies/privacy",
    "/policies/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_published", true)
      .in("availability", ["available", "made_to_order", "coming_soon", "sold_out"]);

    const products = (data ?? []) as { slug: string; updated_at: string | null }[];
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
