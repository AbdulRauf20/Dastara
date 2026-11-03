"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

/** Button that confirms a destructive/important action before running it. */
export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "destructive",
  onDone,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<ActionResult>;
  variant?: "destructive" | "default" | "outline" | "secondary" | "ghost";
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={variant}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await onConfirm();
                  if (r.ok) {
                    toast.success(r.message ?? "Done.");
                    setOpen(false);
                    onDone?.();
                  } else {
                    toast.error(r.error);
                  }
                })
              }
            >
              {pending ? "Working…" : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
