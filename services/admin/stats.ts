import { createClient } from "@/lib/supabase/server";
import { CONFIRMED_ORDER_STATUSES } from "@/lib/constants";
import type { TypedSupabaseClient } from "@/lib/supabase/server";

async function count(
  supabase: TypedSupabaseClient,
  table:
    | "products"
    | "order_inquiries"
    | "categories"
    | "suppliers"
    | "customers",
  build: (q: ReturnType<TypedSupabaseClient["from"]>) => unknown,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from(table).select("*", { count: "exact", head: true });
  query = build(query) ?? query;
  const { count: c } = await query;
  return c ?? 0;
}

export interface DashboardStats {
  products: {
    total: number;
    published: number;
    available: number;
    soldOut: number;
    trending: number;
  };
  orders: {
    totalInquiries: number;
    newInquiries: number;
    confirmedOrders: number;
    awaitingPayment: number;
    paidOrders: number;
    dispatched: number;
  };
  finance: {
    verifiedRevenuePaisa: number;
    estimatedProfitPaisa: number | null;
    profitCoverage: { withCost: number; total: number };
  };
  catalog: { categories: number; suppliers: number; customers: number };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    total,
    published,
    available,
    soldOut,
    trending,
    totalInquiries,
    newInquiries,
    awaitingPayment,
    paidOrders,
    dispatched,
    categories,
    suppliers,
    customers,
  ] = await Promise.all([
    count(supabase, "products", (q) => q),
    count(supabase, "products", (q) => q.eq("is_published", true)),
    count(supabase, "products", (q) => q.eq("availability", "available")),
    count(supabase, "products", (q) => q.eq("availability", "sold_out")),
    count(supabase, "products", (q) => q.eq("is_trending", true)),
    count(supabase, "order_inquiries", (q) => q),
    count(supabase, "order_inquiries", (q) => q.eq("status", "inquiry_received")),
    count(supabase, "order_inquiries", (q) => q.eq("payment_status", "awaiting_payment")),
    count(supabase, "order_inquiries", (q) => q.eq("payment_status", "verified")),
    count(supabase, "order_inquiries", (q) => q.eq("status", "dispatched")),
    count(supabase, "categories", (q) => q.eq("is_archived", false)),
    count(supabase, "suppliers", (q) => q),
    count(supabase, "customers", (q) => q),
  ]);

  const confirmedOrders = await count(supabase, "order_inquiries", (q) =>
    q.in("status", CONFIRMED_ORDER_STATUSES),
  );

  // Revenue: sum of VERIFIED payments only (never inquiries).
  const { data: verifiedPayments } = await supabase
    .from("payments")
    .select("amount_paisa, inquiry_id")
    .eq("status", "verified");
  const verifiedRevenuePaisa = (verifiedPayments ?? []).reduce(
    (sum, p) => sum + (p.amount_paisa ?? 0),
    0,
  );

  // Estimated profit: only from items whose product has recorded cost data.
  const finance = await estimateProfit(
    supabase,
    (verifiedPayments ?? []).map((p) => p.inquiry_id),
    verifiedRevenuePaisa,
  );

  return {
    products: { total, published, available, soldOut, trending },
    orders: {
      totalInquiries,
      newInquiries,
      confirmedOrders,
      awaitingPayment,
      paidOrders,
      dispatched,
    },
    finance,
    catalog: { categories, suppliers, customers },
  };
}

async function estimateProfit(
  supabase: TypedSupabaseClient,
  paidInquiryIds: string[],
  verifiedRevenuePaisa: number,
): Promise<DashboardStats["finance"]> {
  if (paidInquiryIds.length === 0) {
    return {
      verifiedRevenuePaisa,
      estimatedProfitPaisa: null,
      profitCoverage: { withCost: 0, total: 0 },
    };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .in("inquiry_id", paidInquiryIds);

  const rows = items ?? [];
  const productIds = Array.from(
    new Set(rows.map((r) => r.product_id).filter((id): id is string => !!id)),
  );

  if (productIds.length === 0) {
    return {
      verifiedRevenuePaisa,
      estimatedProfitPaisa: null,
      profitCoverage: { withCost: 0, total: rows.length },
    };
  }

  const { data: privates } = await supabase
    .from("product_private")
    .select("product_id, supplier_cost_paisa, packaging_cost_paisa, delivery_cost_paisa")
    .in("product_id", productIds);

  const costMap = new Map<string, number>();
  for (const p of privates ?? []) {
    if (p.supplier_cost_paisa === null || p.supplier_cost_paisa === undefined) continue;
    costMap.set(
      p.product_id,
      (p.supplier_cost_paisa ?? 0) +
        (p.packaging_cost_paisa ?? 0) +
        (p.delivery_cost_paisa ?? 0),
    );
  }

  let estimatedCost = 0;
  let withCost = 0;
  for (const r of rows) {
    if (r.product_id && costMap.has(r.product_id)) {
      estimatedCost += costMap.get(r.product_id)! * r.quantity;
      withCost += 1;
    }
  }

  // Only report an estimate when we have cost data for every paid item.
  const estimatedProfitPaisa =
    withCost === rows.length && rows.length > 0
      ? verifiedRevenuePaisa - estimatedCost
      : null;

  return {
    verifiedRevenuePaisa,
    estimatedProfitPaisa,
    profitCoverage: { withCost, total: rows.length },
  };
}
