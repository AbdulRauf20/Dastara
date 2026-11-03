import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCapability, roleCan } from "@/lib/auth/guards";
import { getAdminCategories } from "@/services/admin/products";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireCapability("manageProducts");
  const categories = await getAdminCategories();

  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <PageHeader title="Add product" description="Create a new catalogue item. SKU is generated automatically." />
      <ProductForm
        categories={categories}
        canSeeFinancials={roleCan(session.profile.role, "viewFinancials")}
      />
    </div>
  );
}
