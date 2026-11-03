import Link from "next/link";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/services/site";
import { PageHeader } from "@/components/admin/page-header";
import { MerchandisingManager, type MerchItem } from "@/components/admin/merchandising-manager";

export const dynamic = "force-dynamic";

export default async function MerchandisingPage() {
  await requireCapability("manageProducts");
  const supabase = await createClient();
  const settings = await getSiteSettings();

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, sku, is_trending, trending_order, is_featured, featured_order, is_new_arrival, new_arrival_order",
    )
    .not("availability", "eq", "archived")
    .order("name", { ascending: true })
    .limit(300);

  const products = (data ?? []) as MerchItem[];

  return (
    <div>
      <PageHeader
        title="Merchandising"
        description="Control Trending, Featured, and New Arrival sections. Toggle a product on, then set its display order (lower appears first)."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SectionStatus label="Trending section" enabled={settings.trending_enabled} extra={`Max ${settings.trending_max}`} />
        <SectionStatus label="Featured section" enabled={settings.featured_enabled} />
        <SectionStatus label="New Arrivals section" enabled={settings.new_arrivals_enabled} />
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Section visibility and the trending limit are controlled in{" "}
        <Link href="/admin/settings" className="text-brand-terracotta underline">
          Settings
        </Link>
        .
      </p>

      <MerchandisingManager products={products} />
    </div>
  );
}

function SectionStatus({
  label,
  enabled,
  extra,
}: {
  label: string;
  enabled: boolean;
  extra?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {enabled ? "Enabled" : "Disabled"}
        {extra ? ` · ${extra}` : ""}
      </p>
    </div>
  );
}
