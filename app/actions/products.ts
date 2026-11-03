"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCapability } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validation/product";
import { ok, fail, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { rupeesToPaisa, slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { BUCKETS, isAllowedImage } from "@/lib/storage";

function toPaisaOrNull(v: number | null | undefined): number | null {
  return v === null || v === undefined ? null : rupeesToPaisa(v);
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string,
): Promise<string> {
  const slug = base || `item-${Date.now().toString(36)}`;
  const { data } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (!data || data.id === excludeId) return slug;
  return `${slug}-${Date.now().toString(36).slice(-4)}`;
}

function parse(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    availability: formData.get("availability"),
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice") || "",
    material: formData.get("material") ?? "",
    dimensions: formData.get("dimensions") ?? "",
    color: formData.get("color") ?? "",
    careInstructions: formData.get("careInstructions") ?? "",
    originNote: formData.get("originNote") ?? "",
    originVerified: formData.get("originVerified") === "on" || formData.get("originVerified") === "true",
    isTrending: formData.get("isTrending") === "on" || formData.get("isTrending") === "true",
    trendingOrder: formData.get("trendingOrder") || null,
    isFeatured: formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true",
    featuredOrder: formData.get("featuredOrder") || null,
    isNewArrival: formData.get("isNewArrival") === "on" || formData.get("isNewArrival") === "true",
    newArrivalOrder: formData.get("newArrivalOrder") || null,
    displayOrder: formData.get("displayOrder") || 0,
    supplierCost: formData.get("supplierCost") || "",
    packagingCost: formData.get("packagingCost") || "",
    deliveryCost: formData.get("deliveryCost") || "",
    internalNotes: formData.get("internalNotes") ?? "",
  });
}

export async function createProduct(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let session;
  try {
    session = await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }

  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  }
  const d = parsed.data;
  const supabase = await createClient();
  const slug = await ensureUniqueSlug(supabase, d.slug || slugify(d.name));

  try {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: d.name,
        slug,
        description: d.description || null,
        category_id: d.categoryId || null,
        availability: d.availability as never,
        is_published: d.isPublished ?? false,
        price_paisa: rupeesToPaisa(d.price),
        original_price_paisa: toPaisaOrNull(d.originalPrice ?? null),
        material: d.material || null,
        dimensions: d.dimensions || null,
        color: d.color || null,
        care_instructions: d.careInstructions || null,
        origin_note: d.originNote || null,
        origin_verified: d.originVerified ?? false,
        is_trending: d.isTrending ?? false,
        trending_order: d.trendingOrder ?? null,
        is_featured: d.isFeatured ?? false,
        featured_order: d.featuredOrder ?? null,
        is_new_arrival: d.isNewArrival ?? false,
        new_arrival_order: d.newArrivalOrder ?? null,
        display_order: d.displayOrder ?? 0,
      })
      .select("id, sku")
      .single();

    if (error || !product) throw error ?? new Error("Insert failed");

    await supabase.from("product_private").insert({
      product_id: product.id,
      supplier_cost_paisa: toPaisaOrNull(d.supplierCost ?? null),
      packaging_cost_paisa: toPaisaOrNull(d.packagingCost ?? null),
      delivery_cost_paisa: toPaisaOrNull(d.deliveryCost ?? null),
      internal_notes: d.internalNotes || null,
    });

    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "product.create",
      entityType: "product",
      entityId: product.id,
      metadata: { sku: product.sku, name: d.name },
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return ok({ id: product.id }, "Product created.");
  } catch (err) {
    console.error("[products] create failed", err);
    return fail("Could not create product. Please try again.");
  }
}

export async function updateProduct(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }

  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  }
  const d = parsed.data;
  const supabase = await createClient();
  const slug = await ensureUniqueSlug(supabase, d.slug || slugify(d.name), id);

  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: d.name,
        slug,
        description: d.description || null,
        category_id: d.categoryId || null,
        availability: d.availability as never,
        is_published: d.isPublished ?? false,
        price_paisa: rupeesToPaisa(d.price),
        original_price_paisa: toPaisaOrNull(d.originalPrice ?? null),
        material: d.material || null,
        dimensions: d.dimensions || null,
        color: d.color || null,
        care_instructions: d.careInstructions || null,
        origin_note: d.originNote || null,
        origin_verified: d.originVerified ?? false,
        is_trending: d.isTrending ?? false,
        trending_order: d.trendingOrder ?? null,
        is_featured: d.isFeatured ?? false,
        featured_order: d.featuredOrder ?? null,
        is_new_arrival: d.isNewArrival ?? false,
        new_arrival_order: d.newArrivalOrder ?? null,
        display_order: d.displayOrder ?? 0,
      })
      .eq("id", id);

    if (error) throw error;

    await supabase.from("product_private").upsert({
      product_id: id,
      supplier_cost_paisa: toPaisaOrNull(d.supplierCost ?? null),
      packaging_cost_paisa: toPaisaOrNull(d.packagingCost ?? null),
      delivery_cost_paisa: toPaisaOrNull(d.deliveryCost ?? null),
      internal_notes: d.internalNotes || null,
    });

    await logAudit({
      actorId: session.userId,
      actorEmail: session.email,
      action: "product.update",
      entityType: "product",
      entityId: id,
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/shop");
    return ok(undefined, "Product saved.");
  } catch (err) {
    console.error("[products] update failed", err);
    return fail("Could not save product. Please try again.");
  }
}

export async function setProductPublished(id: string, published: boolean): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_published: published })
    .eq("id", id);
  if (error) return fail("Could not update.");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return ok(undefined, published ? "Published." : "Unpublished.");
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ availability: "archived", is_published: false })
    .eq("id", id);
  if (error) return fail("Could not archive.");
  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "product.archive",
    entityType: "product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return ok(undefined, "Product archived.");
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();

  // Remove storage objects first (best effort).
  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  if (images && images.length > 0) {
    await supabase.storage.from(BUCKETS.product).remove(images.map((i) => i.storage_path));
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return fail("Could not delete. Products linked to orders should be archived instead.");

  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "product.delete",
    entityType: "product",
    entityId: id,
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return ok(undefined, "Product deleted.");
}

// --- Merchandising toggles -------------------------------------------------
export async function setMerchandiseFlag(
  id: string,
  field: "is_trending" | "is_featured" | "is_new_arrival",
  value: boolean,
): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ [field]: value } as never)
    .eq("id", id);
  if (error) return fail("Could not update.");
  revalidatePath("/admin/merchandising");
  revalidatePath("/");
  return ok(undefined, "Updated.");
}

export async function setMerchandiseOrder(
  id: string,
  field: "trending_order" | "featured_order" | "new_arrival_order",
  value: number | null,
): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ [field]: value } as never)
    .eq("id", id);
  if (error) return fail("Could not update.");
  revalidatePath("/admin/merchandising");
  revalidatePath("/");
  return ok(undefined, "Order updated.");
}

// --- Images ----------------------------------------------------------------
export async function uploadProductImage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "");
  if (!productId || !(file instanceof File) || file.size === 0) {
    return fail("Select an image to upload.");
  }
  const invalid = isAllowedImage({ type: file.type, size: file.size });
  if (invalid) return fail(invalid);

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKETS.product)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) {
    console.error("[products] image upload failed", uploadErr);
    return fail("Image upload failed.");
  }

  // Determine ordering + primary (first image becomes primary).
  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  const isFirst = (count ?? 0) === 0;

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    alt_text: altText || null,
    display_order: count ?? 0,
    is_primary: isFirst,
  });
  if (error) {
    await supabase.storage.from(BUCKETS.product).remove([path]);
    return fail("Could not save image.");
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  return ok(undefined, "Image uploaded.");
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, is_primary")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return fail("Image not found.");

  await supabase.storage.from(BUCKETS.product).remove([img.storage_path]);
  await supabase.from("product_images").delete().eq("id", imageId);

  // If we removed the primary, promote the next image.
  if (img.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", img.product_id)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("product_images").update({ is_primary: true }).eq("id", next.id);
    }
  }

  revalidatePath(`/admin/products/${img.product_id}`);
  revalidatePath("/shop");
  return ok(undefined, "Image removed.");
}

export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return fail("Image not found.");

  // Clear existing primary, then set the new one (unique partial index safe).
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", img.product_id)
    .eq("is_primary", true);
  await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId);

  revalidatePath(`/admin/products/${img.product_id}`);
  revalidatePath("/shop");
  return ok(undefined, "Primary image set.");
}

export async function reorderProductImage(
  imageId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    await assertCapability("manageProducts");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("id, product_id, display_order")
    .eq("id", imageId)
    .maybeSingle();
  if (!img) return fail("Image not found.");

  const { data: siblings } = await supabase
    .from("product_images")
    .select("id, display_order")
    .eq("product_id", img.product_id)
    .order("display_order", { ascending: true });
  if (!siblings) return fail("Could not reorder.");

  const idx = siblings.findIndex((s) => s.id === imageId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return ok(undefined);

  const a = siblings[idx];
  const b = siblings[swapIdx];
  await supabase.from("product_images").update({ display_order: b.display_order }).eq("id", a.id);
  await supabase.from("product_images").update({ display_order: a.display_order }).eq("id", b.id);

  revalidatePath(`/admin/products/${img.product_id}`);
  return ok(undefined, "Reordered.");
}
