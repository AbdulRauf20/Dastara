import Link from "next/link";
import { SafeImage } from "@/components/storefront/safe-image";
import { categoryImageUrl } from "@/lib/storage";
import type { CategoryRow } from "@/types/database";

export function CollectionCard({ category }: { category: CategoryRow }) {
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-brand-ivory"
    >
      <SafeImage
        src={categoryImageUrl(category.image_path)}
        alt={category.name}
        sizes="(max-width: 640px) 50vw, 33vw"
        className="transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/70 via-brand-charcoal/10 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5">
        <h3 className="font-heading text-xl font-semibold text-brand-ivory">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 line-clamp-1 text-sm text-brand-ivory/80">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
