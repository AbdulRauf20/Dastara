"use client";

import { useState } from "react";
import { SafeImage } from "@/components/storefront/safe-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string | null; alt: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0] ?? { url: null, alt: name };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative product-aspect w-full overflow-hidden rounded-lg bg-brand-ivory">
        <SafeImage src={main.url} alt={main.alt} priority sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md bg-brand-ivory ring-offset-2 transition",
                active === i ? "ring-2 ring-brand-terracotta" : "hover:opacity-80",
              )}
              aria-label={`View image ${i + 1}`}
            >
              <SafeImage src={img.url} alt={img.alt} sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
