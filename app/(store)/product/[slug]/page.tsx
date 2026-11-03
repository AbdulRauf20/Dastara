import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts, primaryImage } from "@/services/catalog";
import { getSiteSettings } from "@/services/site";
import { productImageUrl } from "@/lib/storage";
import { formatPKR, getSiteUrl, truncate } from "@/lib/utils";
import { availabilityMeta, type Availability } from "@/lib/constants";
import { Price } from "@/components/products/price";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { ProductGallery } from "@/components/products/product-gallery";
import { OrderDialog } from "@/components/products/order-dialog";
import { ProductGrid } from "@/components/products/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ViewTracker } from "@/components/products/view-tracker";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const img = primaryImage(product.images ?? []);
  const url = productImageUrl(img?.storage_path);
  const description = product.description
    ? truncate(product.description, 160)
    : `${product.name} — handmade, thoughtfully found by DASTARA.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `${getSiteUrl()}/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: url ? [{ url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getSiteSettings(),
    getRelatedProducts(product, 4),
  ]);

  const meta = availabilityMeta[product.availability as Availability];
  const canOrder = meta?.canOrder ?? false;

  const galleryImages = (product.images ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({ url: productImageUrl(img.storage_path), alt: img.alt_text || product.name }));
  if (galleryImages.length === 0) galleryImages.push({ url: null, alt: product.name });

  const primaryUrl = productImageUrl(primaryImage(product.images ?? [])?.storage_path);

  const specs: [string, string | null][] = [
    ["Category", product.category?.name ?? null],
    ["Material", product.material],
    ["Dimensions", product.dimensions],
    ["Colour", product.color],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description ?? undefined,
    image: primaryUrl ? [primaryUrl] : undefined,
    category: product.category?.name ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: (product.price_paisa / 100).toFixed(2),
      availability: canOrder
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container py-8 sm:py-12">
      <ViewTracker productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="px-2">/</span>
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        {product.category && (
          <>
            <span className="px-2">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={galleryImages} name={product.name} />

        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <AvailabilityBadge availability={product.availability} />
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            </div>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{product.name}</h1>
            <Price
              pricePaisa={product.price_paisa}
              originalPricePaisa={product.original_price_paisa}
              size="lg"
            />
          </div>

          {product.description && (
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {/* Order action */}
          <div className="pt-1">
            {canOrder ? (
              <OrderDialog
                product={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  pricePaisa: product.price_paisa,
                  imageUrl: primaryUrl,
                }}
                deliveryFeePaisa={settings.delivery_fee_paisa}
                freeDeliveryThresholdPaisa={settings.free_delivery_threshold_paisa}
                deliveryEstimate={settings.delivery_estimate}
              />
            ) : (
              <div className="rounded-md border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
                This piece is currently <strong>{meta?.label ?? "unavailable"}</strong> and
                can&apos;t be ordered right now. Message us on WhatsApp to be notified.
              </div>
            )}
          </div>

          {/* Specs */}
          <dl className="mt-2 divide-y divide-border border-y border-border text-sm">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
          </dl>

          {product.care_instructions && (
            <Detail title="Care instructions" body={product.care_instructions} />
          )}
          {product.origin_verified && product.origin_note && (
            <Detail title="Origin & artisan" body={product.origin_note} />
          )}

          <div className="mt-2 rounded-md bg-brand-ivory/60 p-4 text-xs leading-relaxed text-muted-foreground">
            Orders are placed via WhatsApp. After you submit an inquiry we confirm availability
            with the artisan, then share payment details. {settings.delivery_estimate}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading title="You may also like" />
          <ProductGrid className="mt-8" products={related} />
        </section>
      )}
    </div>
  );
}

function Detail({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-heading text-base">{title}</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
