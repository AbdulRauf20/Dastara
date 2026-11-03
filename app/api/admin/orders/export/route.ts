import { NextResponse } from "next/server";
import { getCurrentAdmin, roleCan } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { orderStatusMeta, paymentStatusMeta, type OrderStatus, type PaymentStatus } from "@/lib/constants";
import { paisaToRupees } from "@/lib/utils";
import type { OrderInquiryRow } from "@/types/database";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  // Server-side authorization: must be an active admin with order access.
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roleCan(session.profile.role, "manageOrders")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("order_inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as OrderInquiryRow[];

  const header = [
    "Order Ref",
    "Date",
    "Customer",
    "Phone",
    "City",
    "Status",
    "Payment",
    "Subtotal (PKR)",
    "Delivery (PKR)",
    "Total (PKR)",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const o of orders) {
    lines.push(
      [
        o.order_ref,
        new Date(o.created_at).toISOString(),
        o.customer_name,
        o.customer_phone,
        o.city,
        orderStatusMeta[o.status as OrderStatus]?.label ?? o.status,
        paymentStatusMeta[o.payment_status as PaymentStatus]?.label ?? o.payment_status,
        paisaToRupees(o.subtotal_paisa),
        paisaToRupees(o.delivery_fee_paisa),
        paisaToRupees(o.total_paisa),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  const filename = `dastara-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
