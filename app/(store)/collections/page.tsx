import type { Metadata } from "next";
import { getCategories } from "@/services/catalog";
import { CollectionCard } from "@/components/storefront/collection-card";
import { SectionHeading } from "@/components/storefront/section-heading";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore DASTARA's handmade collections by craft and purpose.",
};

export const revalidate = 300;

export default async function CollectionsPage() {
  const categories = await getCategories();

  return (
    <div className="container py-10 sm:py-14">
      <SectionHeading
        eyebrow="Browse by craft"
        title="Collections"
        description="Each collection gathers handmade pieces sourced on demand from local artisans."
      />
      {categories.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Collections are coming soon.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3">
          {categories.map((c) => (
            <CollectionCard key={c.id} category={c} />
          ))}
        </div>
      )}
    </div>
  );
}
