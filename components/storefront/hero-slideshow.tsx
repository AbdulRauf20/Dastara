"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Local handmade photos in public/hero, crossfaded every 2 seconds. */
export const HERO_SLIDES = [
  { src: "/hero/hero-1.jpg", alt: "Sindhi Ralli quilt with house and palm motifs" },
  { src: "/hero/hero-2.jpg", alt: "Handmade Ralli quilt from Tharparkar" },
  { src: "/hero/hero-3.jpg", alt: "Folded handwoven textiles" },
  { src: "/hero/hero-4.jpg", alt: "Colorful handmade woven textiles" },
  { src: "/hero/hero-5.jpg", alt: "Handwoven shawl with traditional motifs" },
] as const;

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-brand-ivory md:aspect-[5/6]">
      {HERO_SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {HERO_SLIDES.map((slide, i) => (
          <span
            key={slide.src}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
