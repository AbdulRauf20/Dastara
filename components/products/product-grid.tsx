import { ProductCard } from "@/components/products/product-card";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types";

export function ProductGrid({
  products,
  className,
}: {
  products: ProductListItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
