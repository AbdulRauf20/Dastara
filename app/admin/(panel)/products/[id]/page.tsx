import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireCapability, roleCan } from "@/lib/auth/guards";
import { getAdminProduct, getAdminCategories } from "@/services/admin/products";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageProducts");
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
        {product.is_published && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/product/${product.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> View live
            </Link>
          </Button>
        )}
      </div>
      <PageHeader title={product.name} description={`SKU ${product.sku}`} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageManager productId={product.id} images={product.images} />
        </CardContent>
      </Card>

      <ProductForm
        categories={categories}
        product={product}
        canSeeFinancials={roleCan(session.profile.role, "viewFinancials")}
      />
    </div>
  );
}
