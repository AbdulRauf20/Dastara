"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { linkProductSupplier, unlinkProductSupplier } from "@/app/actions/suppliers";
import { formatPKR } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface LinkedProduct {
  linkId: string;
  productId: string;
  name: string;
  sku: string;
  supplierPricePaisa: number | null;
  leadTimeDays: number | null;
  isAvailable: boolean;
}

export interface SelectableProduct {
  id: string;
  name: string;
  sku: string;
}

export function ProductLinkManager({
  supplierId,
  links,
  products,
}: {
  supplierId: string;
  links: LinkedProduct[];
  products: SelectableProduct[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(linkProductSupplier, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Linked.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  const linkedIds = new Set(links.map((l) => l.productId));
  const available = products.filter((p) => !linkedIds.has(p.id));

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="supplierId" value={supplierId} />
        <div className="space-y-1.5">
          <Label htmlFor="productId">Product</Label>
          <select
            id="productId"
            name="productId"
            required
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select a product…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplierPrice">Supplier price (PKR)</Label>
          <Input id="supplierPrice" name="supplierPrice" type="number" min="0" step="1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leadTimeDays">Lead time (days)</Label>
          <Input id="leadTimeDays" name="leadTimeDays" type="number" min="0" step="1" />
        </div>
        <Button type="submit" disabled={pending || available.length === 0}>
          {pending ? "Linking…" : "Link"}
        </Button>
        <label className="flex items-center gap-2 text-sm sm:col-span-4">
          <input type="checkbox" name="isAvailable" defaultChecked /> Currently available from this supplier
        </label>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Supplier cost</TableHead>
            <TableHead>Lead time</TableHead>
            <TableHead>Available</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No products linked yet.
              </TableCell>
            </TableRow>
          ) : (
            links.map((l) => (
              <TableRow key={l.linkId}>
                <TableCell>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.sku}</p>
                </TableCell>
                <TableCell>{l.supplierPricePaisa != null ? formatPKR(l.supplierPricePaisa) : "—"}</TableCell>
                <TableCell>{l.leadTimeDays != null ? `${l.leadTimeDays} days` : "—"}</TableCell>
                <TableCell>{l.isAvailable ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <ConfirmButton
                    title="Unlink product"
                    description={`Remove the link between this supplier and ${l.name}?`}
                    confirmLabel="Unlink"
                    onConfirm={() => unlinkProductSupplier(l.linkId, supplierId)}
                    onDone={() => router.refresh()}
                  >
                    Unlink
                  </ConfirmButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
