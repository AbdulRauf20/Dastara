"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setMerchandiseFlag, setMerchandiseOrder } from "@/app/actions/products";

export interface MerchItem {
  id: string;
  name: string;
  sku: string;
  is_trending: boolean;
  trending_order: number | null;
  is_featured: boolean;
  featured_order: number | null;
  is_new_arrival: boolean;
  new_arrival_order: number | null;
}

type FlagField = "is_trending" | "is_featured" | "is_new_arrival";
type OrderField = "trending_order" | "featured_order" | "new_arrival_order";

export function MerchandisingManager({ products }: { products: MerchItem[] }) {
  const [items, setItems] = useState(products);
  const [, startTransition] = useTransition();

  const toggle = (id: string, field: FlagField, value: boolean) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    startTransition(async () => {
      const r = await setMerchandiseFlag(id, field, value);
      if (!r.ok) toast.error(r.error);
    });
  };

  const setOrder = (id: string, field: OrderField, raw: string) => {
    const value = raw === "" ? null : parseInt(raw, 10);
    if (raw !== "" && Number.isNaN(value)) return;
    startTransition(async () => {
      const r = await setMerchandiseOrder(id, field, value);
      if (r.ok) toast.success("Order updated.");
      else toast.error(r.error);
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Trending</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>New Arrival</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No products yet. Add and publish products first.
              </TableCell>
            </TableRow>
          ) : (
            items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium">{p.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                </TableCell>
                <MerchCell
                  on={p.is_trending}
                  order={p.trending_order}
                  onToggle={(v) => toggle(p.id, "is_trending", v)}
                  onOrder={(v) => setOrder(p.id, "trending_order", v)}
                />
                <MerchCell
                  on={p.is_featured}
                  order={p.featured_order}
                  onToggle={(v) => toggle(p.id, "is_featured", v)}
                  onOrder={(v) => setOrder(p.id, "featured_order", v)}
                />
                <MerchCell
                  on={p.is_new_arrival}
                  order={p.new_arrival_order}
                  onToggle={(v) => toggle(p.id, "is_new_arrival", v)}
                  onOrder={(v) => setOrder(p.id, "new_arrival_order", v)}
                />
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MerchCell({
  on,
  order,
  onToggle,
  onOrder,
}: {
  on: boolean;
  order: number | null;
  onToggle: (v: boolean) => void;
  onOrder: (v: string) => void;
}) {
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <Switch checked={on} onCheckedChange={onToggle} />
        <Input
          type="number"
          defaultValue={order ?? ""}
          disabled={!on}
          placeholder="#"
          className="h-8 w-16"
          onBlur={(e) => onOrder(e.target.value)}
          aria-label="Display order"
        />
      </div>
    </TableCell>
  );
}
