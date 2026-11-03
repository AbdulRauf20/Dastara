"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addInternalNote } from "@/app/actions/orders";

export function InternalNoteForm({
  inquiryId,
  defaultValue,
}: {
  inquiryId: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Private notes (not visible to the customer)…"
        className="min-h-[90px]"
      />
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await addInternalNote(inquiryId, value);
            if (r.ok) {
              toast.success(r.message ?? "Saved.");
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        {pending ? "Saving…" : "Save note"}
      </Button>
    </div>
  );
}
