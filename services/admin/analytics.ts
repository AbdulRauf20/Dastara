import { createClient } from "@/lib/supabase/server";
import {
  orderStatusMeta,
  paymentStatusMeta,
  CONFIRMED_ORDER_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

export interface AnalyticsData {
  totals: {
    inquiries: number;
    confirmed: number;
    verifiedPaid: number;
    subscribers: number;
  };
  conversion: {
    inquiryToConfirmed: number; // 0..1
    confirmedToPaid: number; // 0..1
  };
  statusDistribution: { status: OrderStatus; label: string; count: number }[];
  paymentDistribution: { status: PaymentStatus; label: string; count: number }[];
  topProducts: { id: string; name: string; sku: string; inquiryCount: number; viewCount: number }[];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { data: inquiries } = await supabase
    .from("order_inquiries")
    .select("status, payment_status");
  const rows = inquiries ?? [];

  const statusCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  for (const r of rows) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
    paymentCounts.set(r.payment_status, (paymentCounts.get(r.payment_status) ?? 0) + 1);
  }

  const inquiriesTotal = rows.length;
  const confirmed = rows.filter((r) =>
    (CONFIRMED_ORDER_STATUSES as readonly string[]).includes(r.status),
  ).length;
  const verifiedPaid = rows.filter((r) => r.payment_status === "verified").length;

  const { count: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true });

  const { data: topData } = await supabase
    .from("products")
    .select("id, name, sku, inquiry_count, view_count")
    .order("inquiry_count", { ascending: false })
    .limit(10);

  const statusDistribution = (Object.keys(orderStatusMeta) as OrderStatus[])
    .map((status) => ({
      status,
      label: orderStatusMeta[status].label,
      count: statusCounts.get(status) ?? 0,
    }))
    .filter((s) => s.count > 0);

  const paymentDistribution = (Object.keys(paymentStatusMeta) as PaymentStatus[])
    .map((status) => ({
      status,
      label: paymentStatusMeta[status].label,
      count: paymentCounts.get(status) ?? 0,
    }))
    .filter((s) => s.count > 0);

  return {
    totals: {
      inquiries: inquiriesTotal,
      confirmed,
      verifiedPaid,
      subscribers: subscribers ?? 0,
    },
    conversion: {
      inquiryToConfirmed: inquiriesTotal > 0 ? confirmed / inquiriesTotal : 0,
      confirmedToPaid: confirmed > 0 ? verifiedPaid / confirmed : 0,
    },
    statusDistribution,
    paymentDistribution,
    topProducts: (topData ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      inquiryCount: p.inquiry_count ?? 0,
      viewCount: p.view_count ?? 0,
    })),
  };
}
