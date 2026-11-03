import Link from "next/link";
import { Search, Download } from "lucide-react";
import { requireCapability } from "@/lib/auth/guards";
import { listInquiries } from "@/services/admin/orders";
import { formatPKR, formatDate } from "@/lib/utils";
import { formatPkPhoneDisplay } from "@/lib/phone";
import { orderStatusMeta, paymentStatusMeta } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; paymentStatus?: string; page?: string }>;
}) {
  await requireCapability("manageOrders");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { items, total, perPage } = await listInquiries({
    q: sp.q,
    status: sp.status,
    paymentStatus: sp.paymentStatus,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader
        title="Order Inquiries"
        description={`${total} total inquiries`}
        action={
          <Button asChild variant="outline">
            <Link href="/api/admin/orders/export" prefetch={false}>
              <Download className="h-4 w-4" /> Export CSV
            </Link>
          </Button>
        }
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Ref, name, or phone…" className="pl-9" />
        </div>
        <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All statuses</option>
          {Object.entries(orderStatusMeta).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
        <select name="paymentStatus" defaultValue={sp.paymentStatus ?? ""} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All payments</option>
          {Object.entries(paymentStatusMeta).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((o) => (
                <TableRow key={o.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-medium text-brand-terracotta hover:underline">
                      {o.order_ref}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{formatPkPhoneDisplay(o.customer_phone)}</p>
                  </TableCell>
                  <TableCell>{o.city}</TableCell>
                  <TableCell>{formatPKR(o.total_paisa)}</TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell><PaymentStatusBadge status={o.payment_status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(o.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders?page=${page - 1}`}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders?page=${page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
