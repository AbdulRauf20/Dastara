"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordPayment } from "@/app/actions/orders";
import { paymentMethodLabels, PAYMENT_STATUS, paymentStatusMeta } from "@/lib/constants";

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PaymentForm({
  inquiryId,
  defaultAmountPaisa,
  canVerify,
}: {
  inquiryId: string;
  defaultAmountPaisa: number;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(recordPayment, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Recorded.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input id="amount" name="amount" type="number" step="0.01" defaultValue={(defaultAmountPaisa / 100).toString()} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="method">Method</Label>
          <select id="method" name="method" className={selectCls} defaultValue="bank_transfer">
            {Object.entries(paymentMethodLabels).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Payment status</Label>
        <select id="status" name="status" className={selectCls} defaultValue="proof_received">
          {Object.values(PAYMENT_STATUS)
            .filter((s) => s !== "not_requested")
            .map((s) => (
              <option key={s} value={s} disabled={s === "verified" && !canVerify}>
                {paymentStatusMeta[s].label}
                {s === "verified" && !canVerify ? " (no permission)" : ""}
              </option>
            ))}
        </select>
        {!canVerify && (
          <p className="text-xs text-muted-foreground">
            Only Admins/Super Admins can verify payments.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="transactionRef">Transaction ref</Label>
          <Input id="transactionRef" name="transactionRef" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentDate">Payment date</Label>
          <Input id="paymentDate" name="paymentDate" type="date" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" className="min-h-[50px]" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Record payment"}
      </Button>
      <p className="text-xs text-muted-foreground">
        A customer screenshot is proof received — not verified. Verification is an explicit action.
      </p>
    </form>
  );
}
