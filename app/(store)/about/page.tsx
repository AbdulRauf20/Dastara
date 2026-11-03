import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/services/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "DASTARA discovers handmade products from local artisans in Pakistan, beginning in interior Sindh.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const about = settings.policies?.about;

  return (
    <div className="container max-w-3xl py-14 sm:py-20">
      <p className="eyebrow">Our Story</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold sm:text-5xl">
        Handmade. Thoughtfully Found.
      </h1>

      <div className="prose-dastara mt-8 space-y-5 text-muted-foreground leading-relaxed">
        {about ? (
          <p className="whitespace-pre-line text-lg">{about}</p>
        ) : (
          <>
            <p className="text-lg">
              DASTARA discovers handmade products from local artisans, beginning in interior
              Sindh, Pakistan, and brings them to you through a calm, considered shopping
              experience.
            </p>
            <p>
              We work with a low-inventory, sourced-on-demand model. Rather than mass-producing
              or over-stocking, we photograph and list pieces with the maker&apos;s permission,
              then procure each item only after your order is confirmed. This keeps craftsmanship
              at the centre and reduces waste.
            </p>
          </>
        )}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          ["Authentic", "Real handmade pieces, listed with the maker's permission."],
          ["Transparent", "We confirm availability before asking for payment."],
          ["Careful", "Every piece is quality-inspected before dispatch."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-heading text-lg">{t}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex gap-3">
        <Button asChild size="lg">
          <Link href="/shop">Explore the collection</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>
    </div>
  );
}
