"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct, updateProduct } from "@/app/actions/products";
import { availabilityMeta } from "@/lib/constants";
import { paisaToRupees } from "@/lib/utils";
import type { AdminProductDetail } from "@/services/admin/products";
import type { CategoryRow } from "@/types/database";
import type { ActionResult } from "@/lib/action-result";

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProductForm({
  categories,
  product,
  canSeeFinancials,
}: {
  categories: CategoryRow[];
  product?: AdminProductDetail;
  canSeeFinancials: boolean;
}) {
  const router = useRouter();
  const isEdit = !!product;

  const action = isEdit
    ? (updateProduct.bind(null, product!.id) as (
        prev: ActionResult | null,
        fd: FormData,
      ) => Promise<ActionResult>)
    : (createProduct as unknown as (
        prev: ActionResult | null,
        fd: FormData,
      ) => Promise<ActionResult>);

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      if (!isEdit && state.data && typeof state.data === "object" && "id" in state.data) {
        router.push(`/admin/products/${(state.data as { id: string }).id}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(state.error);
    }
  }, [state, isEdit, router]);

  const err = (f: string) => (!state?.ok && state?.fieldErrors?.[f]?.[0]) || undefined;
  const priv = product?.private;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Product name" name="name" defaultValue={product?.name} error={err("name")} required />
              <Field label="Slug (optional)" name="slug" defaultValue={product?.slug} hint="Auto-generated from name if left blank." error={err("slug")} />
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={product?.description ?? ""} className="min-h-[120px]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="categoryId">Category</Label>
                  <select id="categoryId" name="categoryId" defaultValue={product?.category_id ?? ""} className={selectCls}>
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="availability">Availability</Label>
                  <select id="availability" name="availability" defaultValue={product?.availability ?? "draft"} className={selectCls}>
                    {Object.entries(availabilityMeta).map(([v, m]) => (
                      <option key={v} value={v}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing (PKR)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling price" name="price" type="number" step="0.01" defaultValue={product ? String(paisaToRupees(product.price_paisa)) : ""} error={err("price")} required />
              <Field label="Original price (compare-at)" name="originalPrice" type="number" step="0.01" defaultValue={product?.original_price_paisa ? String(paisaToRupees(product.original_price_paisa)) : ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Material" name="material" defaultValue={product?.material ?? ""} />
              <Field label="Dimensions" name="dimensions" defaultValue={product?.dimensions ?? ""} />
              <Field label="Colour" name="color" defaultValue={product?.color ?? ""} />
              <Field label="Display order" name="displayOrder" type="number" defaultValue={String(product?.display_order ?? 0)} />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="careInstructions">Care instructions</Label>
                <Textarea id="careInstructions" name="careInstructions" defaultValue={product?.care_instructions ?? ""} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="originNote">Origin / artisan note</Label>
                <Textarea id="originNote" name="originNote" defaultValue={product?.origin_note ?? ""} />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="originVerified" defaultChecked={product?.origin_verified} />
                  Origin verified (only verified notes show publicly)
                </label>
              </div>
            </CardContent>
          </Card>

          {canSeeFinancials && (
            <Card className="border-brand-terracotta/30">
              <CardHeader>
                <CardTitle>Private — costs &amp; notes</CardTitle>
                <p className="text-xs text-muted-foreground">Never shown publicly. Used for margin estimates.</p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Supplier cost" name="supplierCost" type="number" step="0.01" defaultValue={priv?.supplier_cost_paisa ? String(paisaToRupees(priv.supplier_cost_paisa)) : ""} />
                <Field label="Packaging cost" name="packagingCost" type="number" step="0.01" defaultValue={priv?.packaging_cost_paisa ? String(paisaToRupees(priv.packaging_cost_paisa)) : ""} />
                <Field label="Delivery cost" name="deliveryCost" type="number" step="0.01" defaultValue={priv?.delivery_cost_paisa ? String(paisaToRupees(priv.delivery_cost_paisa)) : ""} />
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="internalNotes">Internal notes</Label>
                  <Textarea id="internalNotes" name="internalNotes" defaultValue={priv?.internal_notes ?? ""} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublished" defaultChecked={product?.is_published} />
                Published (visible on storefront)
              </label>
              {product && <p className="text-xs text-muted-foreground">SKU: <span className="font-medium text-foreground">{product.sku}</span> (permanent)</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merchandising</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isTrending" defaultChecked={product?.is_trending} /> Trending
              </label>
              <Field label="Trending order" name="trendingOrder" type="number" defaultValue={product?.trending_order?.toString() ?? ""} />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured} /> Featured
              </label>
              <Field label="Featured order" name="featuredOrder" type="number" defaultValue={product?.featured_order?.toString() ?? ""} />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isNewArrival" defaultChecked={product?.is_new_arrival} /> New arrival
              </label>
              <Field label="New arrival order" name="newArrivalOrder" type="number" defaultValue={product?.new_arrival_order?.toString() ?? ""} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : isEdit ? "Save changes" : "Create product"}
          </Button>
          {!isEdit && (
            <p className="text-center text-xs text-muted-foreground">
              You&apos;ll add images after creating the product.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  defaultValue,
  error,
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-brand-terracotta">*</span>}
      </Label>
      <Input id={name} name={name} type={type} step={step} defaultValue={defaultValue} required={required} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
