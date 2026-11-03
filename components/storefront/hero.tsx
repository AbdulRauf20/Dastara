import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/storefront/safe-image";
import { productImageUrl } from "@/lib/storage";
import type { SiteSettingsRow } from "@/types/database";

export function Hero({ settings }: { settings: SiteSettingsRow }) {
  const heroImage = productImageUrl(settings.hero_image_path);
  return (
    <section className="relative overflow-hidden bg-brand-beige">
      <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div className="max-w-xl animate-fade-in space-y-6">
          <p className="eyebrow">Handmade. Thoughtfully Found.</p>
          <h1 className="font-heading text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            {settings.hero_headline || "Made by hand. Chosen with care."}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {settings.hero_subtext ||
              "Discover thoughtfully sourced handmade pieces that bring craftsmanship, culture, and character into everyday life."}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={settings.hero_cta_href || "/shop"}>
                {settings.hero_cta_label || "Explore Collection"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-brand-ivory md:aspect-[5/6]">
          <SafeImage
            src={heroImage}
            alt="DASTARA handmade collection"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
