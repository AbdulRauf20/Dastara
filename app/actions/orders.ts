"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCapability } from "@/lib/auth/guards";
import {
  updateOrderStatusSchema,
  recordPaymentSchema,
} from "@/lib/validation/payment";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { rupeesToPaisa } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import {
  ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";

/** Controlled status transition: validates against the allowed workflow. */
export async function updateOrderStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageOrders");
  } catch (e) {
    return fail((e as Error).message);
  }

  const parsed = updateOrderStatusSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return fail("Invalid status update.");
  const { inquiryId, toStatus, note } = parsed.data;

  const supabase = await createClient();
  const { data: inquiry } = await supabase
    .from("order_inquiries")
    .select("id, status")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inquiry) return fail("Order not found.");

  const from = inquiry.status as OrderStatus;
  const to = toStatus as OrderStatus;

  if (from === to) return fail("Order is already at this status.");
  const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return fail(`Invalid transition from "${from}" to "${to}".`);
  }

  // Keep payment_status loosely in sync for convenience (not verification).
  const patch: { status: OrderStatus; payment_status?: PaymentStatus } = { status: to };
  if (to === "awaiting_payment") patch.payment_status = "awaiting_payment";

  const { error } = await supabase.from("order_inquiries").update(patch).eq("id", inquiryId);
  if (error) return fail("Could not update status.");

  await supabase.from("order_status_history").insert({
    inquiry_id: inquiryId,
    from_status: from,
    to_status: to,
    note: note || null,
    changed_by: session.userId,
    changed_by_email: session.email,
  });

  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "order.status_change",
    entityType: "order_inquiry",
    entityId: inquiryId,
    metadata: { from, to },
  });

  revalidatePath(`/admin/orders/${inquiryId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return ok(undefined, "Status updated.");
}

export async function addInternalNote(
  inquiryId: string,
  note: string,
): Promise<ActionResult> {
  try {
    await assertCapability("manageOrders");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_inquiries")
    .update({ admin_notes: note })
    .eq("id", inquiryId);
  if (error) return fail("Could not save note.");
  revalidatePath(`/admin/orders/${inquiryId}`);
  return ok(undefined, "Note saved.");
}

/**
 * Record a payment. Marking a payment as "verified" is an explicit action and
 * requires the verifyPayments capability — a screenshot alone never verifies.
 */
export async function recordPayment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageOrders");
  } catch (e) {
    return fail((e as Error).message);
  }

  const parsed = recordPaymentSchema.safeParse({
    inquiryId: formData.get("inquiryId"),
    amount: formData.get("amount"),
    method: formData.get("method") || undefined,
    status: formData.get("status"),
    transactionRef: formData.get("transactionRef") ?? "",
    paymentDate: formData.get("paymentDate") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fail("Please check the payment details.");
  const d = parsed.data;
  const status = d.status as PaymentStatus;

  // Verifying requires the explicit capability.
  if (status === "verified") {
    try {
      await assertCapability("verifyPayments");
    } catch {
      return fail("You do not have permission to verify payments.");
    }
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("payments").insert({
    inquiry_id: d.inquiryId,
    amount_paisa: rupeesToPaisa(d.amount),
    method: (d.method as never) ?? null,
    status,
    transaction_ref: d.transactionRef || null,
    payment_date: d.paymentDate ? new Date(d.paymentDate).toISOString() : now,
    verified_at: status === "verified" ? now : null,
    verified_by: status === "verified" ? session.userId : null,
    notes: d.notes || null,
  });
  if (error) {
    console.error("[orders] record payment failed", error);
    return fail("Could not record payment.");
  }

  // Reflect the latest payment status on the inquiry.
  await supabase
    .from("order_inquiries")
    .update({ payment_status: status })
    .eq("id", d.inquiryId);

  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: status === "verified" ? "payment.verify" : "payment.record",
    entityType: "order_inquiry",
    entityId: d.inquiryId,
    metadata: { status, amount_paisa: rupeesToPaisa(d.amount) },
  });

  revalidatePath(`/admin/orders/${d.inquiryId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return ok(undefined, status === "verified" ? "Payment verified." : "Payment recorded.");
}
