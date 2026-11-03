import { createClient } from "@/lib/supabase/server";
import type { OrderInquiryRow } from "@/types/database";
import type { InquiryDetail } from "@/types";

export async function listInquiries(params: {
  q?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: OrderInquiryRow[]; total: number; page: number; perPage: number }> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("order_inquiries").select("*", { count: "exact" });

  if (params.q?.trim()) {
    const t = params.q.trim();
    query = query.or(
      `order_ref.ilike.%${t}%,customer_phone.ilike.%${t}%,customer_name.ilike.%${t}%`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (params.status) query = query.eq("status", params.status as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (params.paymentStatus) query = query.eq("payment_status", params.paymentStatus as any);

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { items: data ?? [], total: count ?? 0, page, perPage };
}

export async function getInquiryDetail(id: string): Promise<InquiryDetail | null> {
  const supabase = await createClient();
  const { data: inquiry } = await supabase
    .from("order_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) return null;

  const [{ data: items }, { data: payments }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("*").eq("inquiry_id", id),
    supabase.from("payments").select("*").eq("inquiry_id", id).order("created_at", { ascending: false }),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("inquiry_id", id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ...inquiry,
    items: items ?? [],
    payments: payments ?? [],
    history: history ?? [],
  };
}
