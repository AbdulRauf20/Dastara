"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePaymentConfig } from "@/app/actions/settings";
import type { PaymentConfigRow } from "@/types/database";

export function PaymentConfigForm({ config }: { config: PaymentConfigRow }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePaymentConfig, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">
        These details are shared with customers only after you confirm availability. Payment is always verified
        manually — a screenshot is never treated as confirmed payment.
      </p>
      <Item name="paymentInstructions" label="General payment instructions" value={config.payment_instructions} />
      <Item name="bankDetails" label="Bank transfer details" value={config.bank_details} />
      <Item name="easypaisaDetails" label="Easypaisa details" value={config.easypaisa_details} />
      <Item name="jazzcashDetails" label="JazzCash details" value={config.jazzcash_details} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save payment details"}
        </Button>
      </div>
    </form>
  );
}

function Item({ name, label, value }: { name: string; label: string; value: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={3} defaultValue={value ?? ""} />
    </div>
  );
}
