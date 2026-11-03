import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, MapPin, User, Gift } from "lucide-react";
import { requireCapability, roleCan } from "@/lib/auth/guards";
import { getInquiryDetail } from "@/services/admin/orders";
import { formatPKR, formatDateTime } from "@/lib/utils";
import { formatPkPhoneDisplay, toWaNumber } from "@/lib/phone";
import { buildWaUrl } from "@/lib/whatsapp";
import { orderStatusMeta, paymentMethodLabels } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { PaymentForm } from "@/components/admin/payment-form";
import { InternalNoteForm } from "@/components/admin/internal-note-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageOrders");
  const order = await getInquiryDetail(id);
  if (!order) notFound();

  const canVerify = roleCan(session.profile.role, "verifyPayments");
  const waUrl = buildWaUrl(
    toWaNumber(order.customer_phone),
    `Hello ${order.customer_name}, regarding your DASTARA order ${order.order_ref}:`,
  );

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <PageHeader
        title={order.order_ref}
        description={`Inquiry received ${formatDateTime(order.created_at)}`}
        action={
          <Button asChild variant="accent">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp customer
            </a>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + customer + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <div className="flex gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{it.product_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{it.product_sku}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatPKR(it.unit_price_paisa)} × {it.quantity}</p>
                    <p className="font-medium">{formatPKR(it.line_total_paisa)}</p>
                  </div>
                </div>
              ))}
              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPKR(order.subtotal_paisa)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.delivery_fee_paisa === 0 ? "Free" : formatPKR(order.delivery_fee_paisa)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPKR(order.total_paisa)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer &amp; Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={User} label="Name" value={order.customer_name} />
              <InfoRow icon={MessageCircle} label="WhatsApp" value={formatPkPhoneDisplay(order.customer_phone)} />
              <InfoRow icon={MapPin} label="Delivery" value={`${order.delivery_address}, ${order.city}`} />
              {order.preferred_variant && <InfoRow icon={Gift} label="Variant" value={order.preferred_variant} />}
              {order.special_instructions && <InfoRow icon={Gift} label="Instructions" value={order.special_instructions} />}
              {order.gift_message && <InfoRow icon={Gift} label="Gift message" value={order.gift_message} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {order.history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-terracotta" />
                    <div>
                      <p className="text-sm font-medium">{orderStatusMeta[h.to_status]?.label ?? h.to_status}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(h.created_at)}
                        {h.changed_by_email ? ` · ${h.changed_by_email}` : " · customer"}
                      </p>
                      {h.note && <p className="mt-0.5 text-sm text-muted-foreground">{h.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                      <div>
                        <p className="font-medium">{formatPKR(p.amount_paisa)}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.method ? paymentMethodLabels[p.method] : "—"}
                          {p.transaction_ref ? ` · ${p.transaction_ref}` : ""}
                          {" · "}
                          {formatDateTime(p.payment_date ?? p.created_at)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
            <CardContent>
              <OrderStatusControl inquiryId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Record Payment</CardTitle></CardHeader>
            <CardContent>
              <PaymentForm inquiryId={order.id} defaultAmountPaisa={order.total_paisa} canVerify={canVerify} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
            <CardContent>
              <InternalNoteForm inquiryId={order.id} defaultValue={order.admin_notes ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}
