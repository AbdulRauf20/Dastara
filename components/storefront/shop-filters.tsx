"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CategoryRow } from "@/types/database";

const SORTS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function ShopFilters({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      sp.delete("page");
      startTransition(() => router.push(`${pathname}?${sp.toString()}`));
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q });
        }}
        className="relative w-full md:max-w-xs"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products or SKU…"
          className="pl-9"
          aria-label="Search products"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={params.get("category") ?? "all"}
          onValueChange={(v) => update({ category: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get("availability") ?? "all"}
          onValueChange={(v) => update({ availability: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="made_to_order">Made to Order</SelectItem>
            <SelectItem value="sold_out">Sold Out</SelectItem>
            <SelectItem value="coming_soon">Coming Soon</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.get("sort") ?? "newest"}
          onValueChange={(v) => update({ sort: v })}
        >
          <SelectTrigger className="w-[185px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(params.toString().length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setQ("");
              startTransition(() => router.push(pathname));
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
