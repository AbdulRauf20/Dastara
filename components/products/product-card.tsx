import Link from "next/link";
import { SafeImage } from "@/components/storefront/safe-image";
import { Price } from "@/components/products/price";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { primaryImage } from "@/services/catalog";
import { productImageUrl } from "@/lib/storage";
import type { ProductListItem } from "@/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const img = primaryImage(product.images ?? []);
  const url = productImageUrl(img?.storage_path);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col"
      aria-label={product.name}
    >
      <div className="relative product-aspect w-full overflow-hidden rounded-md bg-brand-ivory">
        <SafeImage
          src={url}
          alt={img?.alt_text || product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.availability !== "available" && (
            <AvailabilityBadge availability={product.availability} />
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {product.category?.name && (
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {product.category.name}
          </span>
        )}
        <h3 className="font-heading text-base leading-snug text-foreground transition-colors group-hover:text-brand-terracotta">
          {product.name}
        </h3>
        <Price
          pricePaisa={product.price_paisa}
          originalPricePaisa={product.original_price_paisa}
          size="sm"
        />
      </div>
    </Link>
  );
}
