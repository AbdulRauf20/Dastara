import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { SupplierForm } from "@/components/admin/supplier-form";
import {
  ProductLinkManager,
  type LinkedProduct,
  type SelectableProduct,
} from "@/components/admin/product-link-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupplierRow, ProductSupplierRow, ProductRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("manageSuppliers");
  const { id } = await params;
  const supabase = await createClient();

  const { data: supplierData } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!supplierData) notFound();
  const supplier = supplierData as SupplierRow;

  const [{ data: linkData }, { data: productData }] = await Promise.all([
    supabase.from("product_suppliers").select("*").eq("supplier_id", id),
    supabase.from("products").select("id, name, sku").order("name"),
  ]);

  const linkRows = (linkData ?? []) as ProductSupplierRow[];
  const products = (productData ?? []) as Pick<ProductRow, "id" | "name" | "sku">[];
  const productById = new Map(products.map((p) => [p.id, p]));

  const links: LinkedProduct[] = linkRows.map((l) => {
    const p = productById.get(l.product_id);
    return {
      linkId: l.id,
      productId: l.product_id,
      name: p?.name ?? "Unknown product",
      sku: p?.sku ?? "—",
      supplierPricePaisa: l.supplier_price_paisa,
      leadTimeDays: l.lead_time_days,
      isAvailable: l.is_available,
    };
  });

  const selectable: SelectableProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
  }));

  return (
    <div>
      <Link
        href="/admin/suppliers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to suppliers
      </Link>
      <PageHeader title={supplier.name} description="Private supplier record and sourced products." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierForm supplier={supplier} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sourced products</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductLinkManager supplierId={supplier.id} links={links} products={selectable} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
