"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCapability } from "@/lib/auth/guards";
import { categorySchema } from "@/lib/validation/category";
import { ok, fail, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string,
): Promise<string> {
  const slug = base || `category-${Date.now().toString(36)}`;
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (!data || data.id === excludeId) return slug;
  return `${slug}-${Date.now().toString(36).slice(-4)}`;
}

export async function createCategory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageCategories");
  } catch (e) {
    return fail((e as Error).message);
  }
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    displayOrder: formData.get("displayOrder") || 0,
    isVisible: formData.get("isVisible") === "on" || formData.get("isVisible") === "true",
  });
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, d.slug || slugify(d.name));

  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name: d.name,
      slug,
      description: d.description || null,
      display_order: d.displayOrder ?? 0,
      is_visible: d.isVisible ?? true,
    })
    .select("id")
    .single();
  if (error || !created) return fail("Could not create category.");

  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "category.create",
    entityType: "category",
    entityId: created.id,
    metadata: { name: d.name },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/collections");
  return ok(undefined, "Category created.");
}

export async function updateCategory(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertCapability("manageCategories");
  } catch (e) {
    return fail((e as Error).message);
  }
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    displayOrder: formData.get("displayOrder") || 0,
    isVisible: formData.get("isVisible") === "on" || formData.get("isVisible") === "true",
  });
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;
  const supabase = await createClient();
  const slug = await uniqueSlug(supabase, d.slug || slugify(d.name), id);

  const { error } = await supabase
    .from("categories")
    .update({
      name: d.name,
      slug,
      description: d.description || null,
      display_order: d.displayOrder ?? 0,
      is_visible: d.isVisible ?? true,
    })
    .eq("id", id);
  if (error) return fail("Could not update category.");

  revalidatePath("/admin/categories");
  revalidatePath("/collections");
  return ok(undefined, "Category saved.");
}

export async function toggleCategoryVisibility(id: string, visible: boolean): Promise<ActionResult> {
  try {
    await assertCapability("manageCategories");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_visible: visible }).eq("id", id);
  if (error) return fail("Could not update.");
  revalidatePath("/admin/categories");
  revalidatePath("/collections");
  return ok(undefined, "Updated.");
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  try {
    await assertCapability("manageCategories");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: true, is_visible: false })
    .eq("id", id);
  if (error) return fail("Could not archive.");
  revalidatePath("/admin/categories");
  revalidatePath("/collections");
  return ok(undefined, "Category archived.");
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await assertCapability("manageCategories");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  // Products reference category with ON DELETE SET NULL, so this is safe.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return fail("Could not delete category.");
  revalidatePath("/admin/categories");
  revalidatePath("/collections");
  return ok(undefined, "Category deleted.");
}
