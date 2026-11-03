"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupplier, updateSupplier } from "@/app/actions/suppliers";
import type { SupplierRow } from "@/types/database";
import type { ActionResult } from "@/lib/action-result";

export function SupplierForm({
  supplier,
  onSuccess,
}: {
  supplier?: SupplierRow;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const isEdit = !!supplier;
  const action = isEdit
    ? (updateSupplier.bind(null, supplier!.id) as (p: ActionResult | null, fd: FormData) => Promise<ActionResult>)
    : createSupplier;
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, onSuccess, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Supplier name</Label>
          <Input id="name" name="name" defaultValue={supplier?.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Contact person</Label>
          <Input id="contactName" name="contactName" defaultValue={supplier?.contact_name ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" defaultValue={supplier?.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={supplier?.location ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Private notes</Label>
        <Textarea id="notes" name="notes" defaultValue={supplier?.notes ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={supplier ? supplier.is_active : true} /> Active supplier
      </label>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : isEdit ? "Save changes" : "Create supplier"}
      </Button>
    </form>
  );
}
