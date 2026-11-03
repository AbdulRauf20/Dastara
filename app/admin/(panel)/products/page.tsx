import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listAdminProducts } from "@/services/admin/products";
import { primaryImage } from "@/services/catalog";
import { productImageUrl } from "@/lib/storage";
import { formatPKR } from "@/lib/utils";
import { availabilityMeta, type Availability } from "@/lib/constants";
import { PageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { SafeImage } from "@/components/storefront/safe-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; availability?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const { items, total, perPage } = await listAdminProducts({
    q: sp.q,
    availability: sp.availability,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"} in your catalogue`}
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </Button>
        }
      />

      <form method="get" className="mb-4 flex gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or SKU…" className="pl-9" />
        </div>
        <select name="availability" defaultValue={sp.availability ?? ""} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
          <option value="">All</option>
          {Object.entries(availabilityMeta).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No products found.{" "}
                  <Link href="/admin/products/new" className="text-brand-terracotta underline">
                    Add your first product
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => {
                const img = primaryImage(p.images ?? []);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-brand-ivory">
                          <SafeImage src={productImageUrl(img?.storage_path)} alt={p.name} sizes="40px" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.category?.name ?? "Uncategorised"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{formatPKR(p.price_paisa)}</TableCell>
                    <TableCell>
                      <AvailabilityBadge availability={p.availability as Availability} />
                    </TableCell>
                    <TableCell>
                      {p.is_published ? (
                        <Badge variant="accent">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProductRowActions id={p.id} isPublished={p.is_published} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.availability ? { availability: sp.availability } : {}), page: String(page - 1) })}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.availability ? { availability: sp.availability } : {}), page: String(page + 1) })}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
