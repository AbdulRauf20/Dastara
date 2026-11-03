import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, listProducts } from "@/services/catalog";
import { getSiteSettings } from "@/services/site";
import { ShopFilters } from "@/components/storefront/shop-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import type { ProductSort } from "@/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full DASTARA catalogue of handmade pieces.",
};

export const revalidate = 60;

interface SearchParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShopPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const settings = await getSiteSettings();
  const categories = await getCategories();

  const page = Math.max(1, parseInt(str(sp.page) ?? "1", 10) || 1);
  const availability = str(sp.availability);

  const result = await listProducts({
    q: str(sp.q),
    categorySlug: str(sp.category),
    availability: availability ? [availability] : undefined,
    sort: (str(sp.sort) as ProductSort) ?? "newest",
    page,
    perPage: 12,
    includeSoldOut: settings.show_sold_out,
  });

  const activeCategory = categories.find((c) => c.slug === str(sp.category));

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = str(v);
      if (val && k !== "page") params.set(k, val);
    }
    params.set("page", String(p));
    return `/shop?${params.toString()}`;
  };

  return (
    <div className="container py-10 sm:py-14">
      <SectionHeading
        eyebrow="The Collection"
        title={activeCategory ? activeCategory.name : "Shop All"}
        description={
          activeCategory?.description ??
          "Thoughtfully sourced handmade pieces. Every order is confirmed with the artisan before payment."
        }
      />

      <div className="my-8">
        <ShopFilters categories={categories} />
      </div>

      {result.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <p className="font-heading text-xl">No products found</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t find pieces matching your filters. Try clearing filters or
            exploring another collection.
          </p>
          <Link href="/shop" className="text-sm font-medium text-brand-terracotta hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            Showing {result.items.length} of {result.total}{" "}
            {result.total === 1 ? "piece" : "pieces"}
          </p>
          <ProductGrid products={result.items} />

          {result.totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={makeHref(page - 1)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
                >
                  Previous
                </Link>
              )}
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} of {result.totalPages}
              </span>
              {page < result.totalPages && (
                <Link
                  href={makeHref(page + 1)}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
