import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product/category image with a tasteful, intentional placeholder when no real
 * photography exists. We never substitute random stock imagery.
 */
export function SafeImage({
  src,
  alt,
  className,
  sizes,
  priority,
  fill = true,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-brand-ivory text-brand-olive",
          className,
        )}
        aria-label={`${alt} — image coming soon`}
        role="img"
      >
        <div className="flex flex-col items-center gap-2 opacity-70">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.2em]">DASTARA</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes ?? "(max-width: 768px) 50vw, 25vw"}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
