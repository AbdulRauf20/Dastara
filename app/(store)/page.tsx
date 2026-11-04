import Link from "next/link";
import { Hammer, ShieldCheck, Sprout, PackageCheck } from "lucide-react";
import { Hero } from "@/components/storefront/hero";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ProductGrid } from "@/components/products/product-grid";
import { CollectionCard } from "@/components/storefront/collection-card";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { getSiteSettings } from "@/services/site";
import { getCategories, getMerchandised } from "@/services/catalog";

export const revalidate = 120;

export default async function HomePage() {
  const settings = await getSiteSettings();

  const [categories, trending, featured, newArrivals] = await Promise.all([
    getCategories(),
    settings.trending_enabled
      ? getMerchandised("trending", settings.trending_max)
      : Promise.resolve([]),
    settings.featured_enabled ? getMerchandised("featured", 8) : Promise.resolve([]),
    settings.new_arrivals_enabled
      ? getMerchandised("new_arrival", 8)
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <Hero settings={settings} />

      {/* Featured collections */}
      {categories.length > 0 && (
        <section className="container py-16 sm:py-20">
          <SectionHeading
            eyebrow="Curated"
            title="Featured Collections"
            description="Explore handmade pieces grouped by craft and purpose."
            href="/collections"
            hrefLabel="All collections"
          />
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3">
            {categories.map((c) => (
              <CollectionCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {settings.trending_enabled && trending.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionHeading
            eyebrow="Loved right now"
            title="Trending at DASTARA"
            description="Hand-selected pieces our community is drawn to."
            href="/shop?sort=popular"
            hrefLabel="Shop trending"
          />
          <ProductGrid className="mt-8" products={trending} />
        </section>
      )}

      {/* Featured products */}
      {settings.featured_enabled && featured.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionHeading eyebrow="Editor's picks" title="Featured Pieces" href="/shop" />
          <ProductGrid className="mt-8" products={featured} />
        </section>
      )}

      {/* New arrivals */}
      {settings.new_arrivals_enabled && newArrivals.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionHeading
            eyebrow="Just in"
            title="New Arrivals"
            href="/shop?sort=newest"
            hrefLabel="See what's new"
          />
          <ProductGrid className="mt-8" products={newArrivals} />
        </section>
      )}

      {/* Brand philosophy */}
      <section className="bg-brand-beige">
        <div className="container grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2">
          <div className="space-y-5">
            <p className="eyebrow">Our philosophy</p>
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
              Craft, culture &amp; character — in every thread
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {settings.policies?.about ||
                "DASTARA discovers handmade products from local artisans, beginning in interior Sindh, Pakistan. Each piece is listed with the maker's permission and sourced on demand — supporting small-batch, low-waste craftsmanship."}
            </p>
            <Link
              href="/about"
              className="inline-flex text-sm font-medium text-brand-terracotta hover:underline"
            >
              Read our story →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              { icon: Hammer, title: "Truly handmade", text: "Made by skilled artisans, not machines." },
              { icon: Sprout, title: "Sourced on demand", text: "Low-waste, small-batch procurement." },
              { icon: ShieldCheck, title: "Quality inspected", text: "Checked before it's dispatched to you." },
              { icon: PackageCheck, title: "Carefully packaged", text: "Delivered across Pakistan with care." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5">
                <Icon className="h-6 w-6 text-brand-terracotta" />
                <h3 className="mt-3 font-heading text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DASTARA — the real process */}
      <section className="container py-16 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Why DASTARA?"
          description="We work a little differently. Here's exactly what happens when you place an inquiry."
        />
        <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Browse & inquire", "Find a piece you love and send an order inquiry — no account needed."],
            ["We confirm availability", "We check with the artisan/supplier and confirm the piece is available."],
            ["Pay in advance", "Once confirmed, we share payment details. Payment is verified manually."],
            ["Inspected & dispatched", "We procure, quality-check, package, and deliver to your door."],
          ].map(([title, text], i) => (
            <li key={title} className="relative rounded-lg border border-border bg-card p-6">
              <span className="font-heading text-3xl text-brand-ivory">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-heading text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Newsletter */}
      <section className="bg-brand-charcoal text-brand-ivory">
        <div className="container flex flex-col items-center gap-6 py-16 text-center">
          <p className="eyebrow">Stay in touch</p>
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
            Thoughtful updates, no noise
          </h2>
          <p className="max-w-prose text-brand-ivory/70">
            Be the first to know when new handmade pieces arrive. We&apos;ll only email
            when it matters.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
