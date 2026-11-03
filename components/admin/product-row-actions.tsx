"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  setProductPublished,
  archiveProduct,
  deleteProduct,
} from "@/app/actions/products";

export function ProductRowActions({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/products/${id}`}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await setProductPublished(id, !isPublished);
            if (r.ok) {
              toast.success(r.message ?? "Updated.");
              router.refresh();
            } else toast.error(r.error);
          })
        }
      >
        {isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <ConfirmButton
        variant="outline"
        title="Archive product?"
        description="Archived products are hidden from the storefront but kept for order history. You can restore by changing availability."
        confirmLabel="Archive"
        onConfirm={() => archiveProduct(id)}
        onDone={() => router.refresh()}
      >
        Archive
      </ConfirmButton>
      <ConfirmButton
        title="Delete product?"
        description="This permanently deletes the product and its images. Products linked to existing orders should be archived instead."
        confirmLabel="Delete"
        onConfirm={() => deleteProduct(id)}
        onDone={() => router.refresh()}
      >
        Delete
      </ConfirmButton>
    </div>
  );
}
