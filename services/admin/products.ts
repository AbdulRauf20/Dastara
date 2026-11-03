import { createClient } from "@/lib/supabase/server";
import type {
  ProductRow,
  ProductImageRow,
  ProductPrivateRow,
  CategoryRow,
} from "@/types/database";

export interface AdminProductListItem extends ProductRow {
  images: ProductImageRow[];
  category: Pick<CategoryRow, "id" | "name"> | null;
}

export interface AdminProductDetail extends ProductRow {
  images: ProductImageRow[];
  private: ProductPrivateRow | null;
}

const ADMIN_SELECT = "*, category:categories(id,name), images:product_images(*)";

export async function listAdminProducts(params: {
  q?: string;
  availability?: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: AdminProductListItem[]; total: number; page: number; perPage: number }> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("products").select(ADMIN_SELECT, { count: "exact" });

  if (params.q?.trim()) {
    const t = params.q.trim();
    query = query.or(`name.ilike.%${t}%,sku.ilike.%${t}%`);
  }
  if (params.availability) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("availability", params.availability as any);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    items: (data ?? []) as unknown as AdminProductListItem[],
    total: count ?? 0,
    page,
    perPage,
  };
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*), private:product_private(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  // `private` embeds as an array or object depending on relationship; normalise.
  const raw = data as unknown as ProductRow & {
    images: ProductImageRow[];
    private: ProductPrivateRow | ProductPrivateRow[] | null;
  };
  const priv = Array.isArray(raw.private) ? (raw.private[0] ?? null) : raw.private;
  return { ...raw, images: raw.images ?? [], private: priv };
}

export async function getAdminCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}
