"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Star, Trash2, ArrowUp, ArrowDown, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/storefront/safe-image";
import { productImageUrl } from "@/lib/storage";
import {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
  reorderProductImage,
} from "@/app/actions/products";
import type { ProductImageRow } from "@/types/database";

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImageRow[];
}) {
  const [state, formAction, pending] = useActionState(uploadProductImage, null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Uploaded.");
      formRef.current?.reset();
      setFileName("");
    } else {
      toast.error(state.error);
    }
  }, [state]);

  const act = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Done.");
      else toast.error(r.error ?? "Failed.");
    });

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="rounded-lg border border-dashed border-border p-4">
        <input type="hidden" name="productId" value={productId} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium">Upload image</label>
            <Input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or AVIF · max 5MB</p>
          </div>
          <Input name="altText" placeholder="Alt text (optional)" className="sm:w-48" />
          <Button type="submit" disabled={pending || !fileName}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload</>}
          </Button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="rounded-md bg-secondary/50 p-4 text-sm text-muted-foreground">
          No images yet. Products without a real photo should stay unpublished.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((img, i) => (
            <div key={img.id} className="group relative overflow-hidden rounded-md border border-border bg-card">
              <div className="relative aspect-square bg-brand-ivory">
                <SafeImage src={productImageUrl(img.storage_path)} alt={img.alt_text ?? "Product image"} sizes="200px" />
                {img.is_primary && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-charcoal px-2 py-0.5 text-[10px] font-medium text-brand-ivory">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <IconBtn title="Move up" disabled={i === 0 || isPending} onClick={() => act(() => reorderProductImage(img.id, "up"))}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn title="Move down" disabled={i === sorted.length - 1 || isPending} onClick={() => act(() => reorderProductImage(img.id, "down"))}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
                <div className="flex gap-1">
                  {!img.is_primary && (
                    <IconBtn title="Set primary" disabled={isPending} onClick={() => act(() => setPrimaryImage(img.id))}>
                      <Star className="h-3.5 w-3.5" />
                    </IconBtn>
                  )}
                  <IconBtn title="Delete" disabled={isPending} onClick={() => act(() => deleteProductImage(img.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-secondary disabled:opacity-40"
    >
      {children}
    </button>
  );
}
