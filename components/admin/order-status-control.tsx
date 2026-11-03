"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { updateOrderStatus } from "@/app/actions/orders";
import {
  ORDER_STATUS_TRANSITIONS,
  orderStatusMeta,
  type OrderStatus,
} from "@/lib/constants";

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function OrderStatusControl({
  inquiryId,
  currentStatus,
}: {
  inquiryId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateOrderStatus, null);
  const [next, setNext] = useState("");

  const options = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Updated.");
      setNext("");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Current:</span>
        <OrderStatusBadge status={currentStatus} />
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This order is in a final state. No further transitions are available.
        </p>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <div className="space-y-1.5">
            <Label htmlFor="toStatus">Move to</Label>
            <select
              id="toStatus"
              name="toStatus"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className={selectCls}
            >
              <option value="" disabled>
                Select next status…
              </option>
              {options.map((s) => (
                <option key={s} value={s}>
                  {orderStatusMeta[s].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" name="note" className="min-h-[60px]" placeholder="Context for this change…" />
          </div>
          <Button type="submit" disabled={pending || !next} className="w-full">
            {pending ? "Updating…" : "Update status"}
          </Button>
        </form>
      )}
    </div>
  );
}
