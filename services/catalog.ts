import { createClient } from "@/lib/supabase/server";
import type {
  ProductFilters,
  ProductListItem,
  ProductWithRelations,
  Paginated,
} from "@/types";
import type { CategoryRow, ProductAvailability } from "@/types/database";

const PRODUCT_SELECT =
  "*, category:categories(id,name,slug), images:product_images(*)";

/** Visible, non-archived categories for storefront navigation. */
export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_visible", true)
    .eq("is_archived", false)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .eq("is_archived", false)
    .maybeSingle();
  return data ?? null;
}

/**
 * List published products for the storefront. RLS guarantees only published,
 * publicly-visible rows are ever returned.
 */
export async function listProducts(
  filters: ProductFilters = {},
): Promise<Paginated<ProductListItem>> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, Math.max(1, filters.perPage ?? 12));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("is_published", true);

  // Availability: never show draft/archived (RLS also enforces). Optionally
  // hide sold-out based on the store setting.
  const allowed: ProductAvailability[] = ["available", "made_to_order", "coming_soon"];
  if (filters.includeSoldOut !== false) allowed.push("sold_out");
  if (filters.availability && filters.availability.length > 0) {
    const requested = filters.availability.filter((a): a is ProductAvailability =>
      (allowed as string[]).includes(a),
    );
    query = query.in("availability", requested.length ? requested : allowed);
  } else {
    query = query.in("availability", allowed);
  }

  if (filters.categorySlug) {
    const cat = await getCategoryBySlug(filters.categorySlug);
    if (cat) query = query.eq("category_id", cat.id);
    else return emptyPage(page, perPage);
  }

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (typeof filters.minPaisa === "number") query = query.gte("price_paisa", filters.minPaisa);
  if (typeof filters.maxPaisa === "number") query = query.lte("price_paisa", filters.maxPaisa);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_paisa", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_paisa", { ascending: false });
      break;
    case "popular":
      query = query
        .order("inquiry_count", { ascending: false })
        .order("view_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query
        .order("display_order", { ascending: true })
        .order("published_at", { ascending: false, nullsFirst: false });
      break;
  }

  const { data, count } = await query.range(from, to);
  const items = (data ?? []) as unknown as ProductListItem[];
  const total = count ?? 0;
  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

function emptyPage(page: number, perPage: number): Paginated<ProductListItem> {
  return { items: [], total: 0, page, perPage, totalPages: 1 };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as unknown as ProductWithRelations) ?? null;
}

/** Published products flagged for a given merchandising section. */
export async function getMerchandised(
  kind: "trending" | "featured" | "new_arrival",
  limit = 8,
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const flag = {
    trending: { col: "is_trending", order: "trending_order" },
    featured: { col: "is_featured", order: "featured_order" },
    new_arrival: { col: "is_new_arrival", order: "new_arrival_order" },
  }[kind];

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .eq(flag.col, true)
    .in("availability", ["available", "made_to_order", "coming_soon", "sold_out"])
    .order(flag.order, { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  return (data ?? []) as unknown as ProductListItem[];
}

/** Related products in the same category (excluding the current one). */
export async function getRelatedProducts(
  product: ProductWithRelations,
  limit = 4,
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_published", true)
    .neq("id", product.id)
    .in("availability", ["available", "made_to_order", "coming_soon", "sold_out"])
    .limit(limit);

  if (product.category_id) query = query.eq("category_id", product.category_id);

  const { data } = await query;
  return (data ?? []) as unknown as ProductListItem[];
}

/** Pick the primary image, falling back to the first by display order. */
export function primaryImage<
  T extends { is_primary: boolean; display_order: number },
>(images: T[] | null | undefined): T | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  return sorted.find((i) => i.is_primary) ?? sorted[0] ?? null;
}
