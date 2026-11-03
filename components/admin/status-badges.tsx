import { orderStatusMeta, paymentStatusMeta, type OrderStatus, type PaymentStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const meta = orderStatusMeta[status as OrderStatus];
  if (!meta) return <span>{status}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.tone)}>
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const meta = paymentStatusMeta[status as PaymentStatus];
  if (!meta) return <span>{status}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", meta.tone)}>
      {meta.label}
    </span>
  );
}
