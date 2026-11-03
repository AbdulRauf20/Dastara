import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/services/site";

const POLICIES: Record<string, { title: string; fallback: string }> = {
  shipping: {
    title: "Shipping & Delivery",
    fallback:
      "We deliver across Pakistan. Because items are sourced on demand, delivery timelines begin after your payment is verified. Estimated delivery is 5–9 working days unless stated otherwise on the product.",
  },
  returns: {
    title: "Returns & Exchanges",
    fallback:
      "As handmade pieces are procured on demand per order, returns are limited. If an item arrives damaged or significantly different from its description, contact us within 48 hours of delivery and we will make it right.",
  },
  care: {
    title: "Product Care",
    fallback:
      "Handle handmade textiles gently. Dry clean or hand wash cold unless the product specifies otherwise. Dry in shade to preserve natural dyes.",
  },
  privacy: {
    title: "Privacy Policy",
    fallback:
      "We collect only the information needed to process your order inquiry (name, WhatsApp number, delivery address). We never sell your data. Supplier and payment details are kept strictly private.",
  },
  terms: {
    title: "Terms & Conditions",
    fallback:
      "Submitting an inquiry is a request, not a confirmed order. Orders are confirmed only after we verify product availability with the artisan/supplier and receive verified advance payment.",
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  const settings = await getSiteSettings();
  const content = settings.policies?.[slug] || policy.fallback;

  return (
    <div className="container max-w-3xl py-14 sm:py-20">
      <p className="eyebrow">Customer Care</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold">{policy.title}</h1>
      <div className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">
        {content}
      </div>
    </div>
  );
}
