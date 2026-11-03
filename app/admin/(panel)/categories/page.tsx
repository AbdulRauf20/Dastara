import { requireCapability } from "@/lib/auth/guards";
import { getAdminCategories } from "@/services/admin/products";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireCapability("manageCategories");
  const categories = await getAdminCategories();

  return (
    <div>
      <PageHeader title="Categories" description="Organise your catalogue into collections." />
      <CategoryManager categories={categories} />
    </div>
  );
}
