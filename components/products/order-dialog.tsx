"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Check, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SafeImage } from "@/components/storefront/safe-image";
import { createOrderInquiry } from "@/app/actions/order";
import { computeOrderTotals } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";

interface OrderDialogProps {
  product: {
    id: string;
    name: string;
    sku: string;
    pricePaisa: number;
    imageUrl: string | null;
  };
  deliveryFeePaisa: number;
  freeDeliveryThresholdPaisa: number | null;
  deliveryEstimate: string | null;
  disabled?: boolean;
  triggerLabel?: string;
}

export function OrderDialog({
  product,
  deliveryFeePaisa,
  freeDeliveryThresholdPaisa,
  deliveryEstimate,
  disabled,
  triggerLabel = "Order Now",
}: OrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(createOrderInquiry, null);

  const totals = useMemo(
    () =>
      computeOrderTotals({
        unitPricePaisa: product.pricePaisa,
        quantity,
        deliveryFeePaisa,
        freeDeliveryThresholdPaisa,
      }),
    [product.pricePaisa, quantity, deliveryFeePaisa, freeDeliveryThresholdPaisa],
  );

  // When the inquiry is saved, open WhatsApp (customer still presses Send).
  useEffect(() => {
    if (state?.ok && state.data?.waUrl) {
      window.open(state.data.waUrl, "_blank", "noopener,noreferrer");
    }
  }, [state]);

  const fieldError = (name: string) =>
    !state?.ok && state?.fieldErrors?.[name]?.[0];

  const succeeded = state?.ok && state.data;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" disabled={disabled} className="w-full sm:w-auto">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        {succeeded ? (
          <SuccessPanel orderRef={state!.data!.orderRef} waUrl={state!.data!.waUrl} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm your order inquiry</DialogTitle>
              <DialogDescription>
                Submitting this records your inquiry and opens WhatsApp with a prefilled
                message. Your order is confirmed only after we verify availability.
              </DialogDescription>
            </DialogHeader>

            {/* Order summary */}
            <div className="flex gap-3 rounded-md border border-border bg-secondary/40 p-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-brand-ivory">
                <SafeImage src={product.imageUrl} alt={product.name} sizes="64px" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-heading text-base leading-tight">{product.name}</p>
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                <p className="mt-1">{formatPKR(product.pricePaisa)} each</p>
              </div>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="quantity" value={quantity} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-base font-medium">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="fullName" error={fieldError("fullName")} required />
                <Field
                  label="WhatsApp number"
                  name="phone"
                  placeholder="0345 3412201"
                  error={fieldError("phone")}
                  required
                />
                <Field label="City" name="city" error={fieldError("city")} required />
                <Field
                  label="Preferred colour / variant"
                  name="preferredVariant"
                  error={fieldError("preferredVariant")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deliveryAddress">
                  Complete delivery address <span className="text-brand-terracotta">*</span>
                </Label>
                <Textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  required
                  placeholder="House/flat, street, area, city, postal code"
                />
                {fieldError("deliveryAddress") && (
                  <p className="text-xs text-destructive">{fieldError("deliveryAddress")}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="specialInstructions">Special instructions</Label>
                  <Textarea id="specialInstructions" name="specialInstructions" className="min-h-[60px]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="giftMessage">Gift message</Label>
                  <Textarea id="giftMessage" name="giftMessage" className="min-h-[60px]" />
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 rounded-md border border-border p-3 text-sm">
                <Row label="Subtotal" value={formatPKR(totals.subtotalPaisa)} />
                <Row
                  label="Delivery"
                  value={totals.deliveryFeePaisa === 0 ? "Free" : formatPKR(totals.deliveryFeePaisa)}
                />
                <div className="my-1 border-t border-border" />
                <Row label="Estimated total" value={formatPKR(totals.totalPaisa)} strong />
                {deliveryEstimate && (
                  <p className="pt-1 text-xs text-muted-foreground">{deliveryEstimate}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                This is an inquiry, not a confirmed order. Final amount is confirmed after we
                verify availability with the artisan.
              </p>

              {!state?.ok && state?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving your inquiry…
                  </>
                ) : (
                  "Submit inquiry & open WhatsApp"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessPanel({ orderRef, waUrl }: { orderRef: string; waUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-olive/15 text-brand-olive">
        <Check className="h-7 w-7" />
      </div>
      <DialogTitle>Inquiry recorded</DialogTitle>
      <p className="text-sm text-muted-foreground">
        Your order reference is{" "}
        <span className="font-medium text-foreground">{orderRef}</span>. We&apos;ve opened
        WhatsApp with your details — please press <strong>Send</strong> to reach us. If it
        didn&apos;t open, use the button below.
      </p>
      <Button asChild size="lg" className="w-full">
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" /> Continue to WhatsApp
        </a>
      </Button>
      <p className="text-xs text-muted-foreground">
        Your inquiry is saved even if you don&apos;t send the message now.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  error?: string | false;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-brand-terracotta">*</span>}
      </Label>
      <Input id={name} name={name} placeholder={placeholder} required={required} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
