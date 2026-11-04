import Link from "next/link";
import { SafeImage } from "@/components/storefront/safe-image";
import { categoryImageUrl } from "@/lib/storage";
import type { CategoryRow } from "@/types/database";

/** Local covers used until an admin uploads one in Supabase Storage. */
const CATEGORY_COVERS: Record<string, string> = {
  "ralli-textiles": "/categories/ralli-textiles.jpg",
  "chaddars-shawls": "/categories/chaddars-shawls.jpg",
  "bags-accessories": "/categories/bags-accessories.jpg",
  "home-living": "/categories/home-living.jpg",
  "art-decor": "/categories/art-decor.jpg",
  "handmade-gifts": "/categories/handmade-gifts.jpg",
};

export function CollectionCard({ category }: { category: CategoryRow }) {
  const cover = categoryImageUrl(category.image_path) ?? CATEGORY_COVERS[category.slug] ?? null;
  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-brand-ivory"
    >
      <SafeImage
        src={cover}
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
