import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPkPhoneDisplay } from "@/lib/phone";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerRow, OrderInquiryRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("manageCustomers");
  const { id } = await params;
  const supabase = await createClient();

  const { data: customerData } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!customerData) notFound();
  const customer = customerData as CustomerRow;

  const { data: orderData } = await supabase
    .from("order_inquiries")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  const orders = (orderData ?? []) as OrderInquiryRow[];

  const confirmedTotal = orders.reduce((sum, o) => sum + (o.total_paisa ?? 0), 0);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>
      <PageHeader title={customer.full_name} description="Customer record and inquiry history." />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Phone" value={formatPkPhoneDisplay(customer.phone)} />
            <Row label="Email" value={customer.email ?? "—"} />
            <Row label="City" value={customer.city ?? "—"} />
            <Row label="First seen" value={formatDate(customer.created_at)} />
            <Row label="Total inquiries" value={String(orders.length)} />
            <Row label="Inquiry value (all)" value={formatPKR(confirmedTotal)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inquiry history</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No inquiries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-medium text-brand-terracotta hover:underline"
                        >
                          {o.order_ref}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(o.created_at)}</TableCell>
                      <TableCell>{formatPKR(o.total_paisa)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={o.payment_status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
