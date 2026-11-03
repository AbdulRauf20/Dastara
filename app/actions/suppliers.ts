"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCapability } from "@/lib/auth/guards";
import { supplierSchema } from "@/lib/validation/supplier";
import { ok, fail, zodFieldErrors, type ActionResult } from "@/lib/action-result";
import { rupeesToPaisa } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

function parseSupplier(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
}

export async function createSupplier(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let session;
  try {
    session = await assertCapability("manageSuppliers");
  } catch (e) {
    return fail((e as Error).message);
  }
  const parsed = parseSupplier(formData);
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    name: d.name,
    contact_name: d.contactName || null,
    phone: d.phone || null,
    email: d.email || null,
    location: d.location || null,
    notes: d.notes || null,
    is_active: d.isActive ?? true,
  });
  if (error) return fail("Could not create supplier.");
  await logAudit({
    actorId: session.userId,
    actorEmail: session.email,
    action: "supplier.create",
    entityType: "supplier",
    metadata: { name: d.name },
  });
  revalidatePath("/admin/suppliers");
  return ok(undefined, "Supplier created.");
}

export async function updateSupplier(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertCapability("manageSuppliers");
  } catch (e) {
    return fail((e as Error).message);
  }
  const parsed = parseSupplier(formData);
  if (!parsed.success) return fail("Please check the form.", zodFieldErrors(parsed.error.flatten()));
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: d.name,
      contact_name: d.contactName || null,
      phone: d.phone || null,
      email: d.email || null,
      location: d.location || null,
      notes: d.notes || null,
      is_active: d.isActive ?? true,
    })
    .eq("id", id);
  if (error) return fail("Could not update supplier.");
  revalidatePath("/admin/suppliers");
  return ok(undefined, "Supplier saved.");
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  try {
    await assertCapability("manageSuppliers");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return fail("Could not delete supplier.");
  revalidatePath("/admin/suppliers");
  return ok(undefined, "Supplier deleted.");
}

export async function linkProductSupplier(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertCapability("manageSuppliers");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supplierId = String(formData.get("supplierId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const price = formData.get("supplierPrice");
  const leadTime = formData.get("leadTimeDays");
  const isAvailable = formData.get("isAvailable") === "on" || formData.get("isAvailable") === "true";
  if (!supplierId || !productId) return fail("Select a product to link.");

  const supabase = await createClient();
  const { error } = await supabase.from("product_suppliers").upsert(
    {
      supplier_id: supplierId,
      product_id: productId,
      supplier_price_paisa: price ? rupeesToPaisa(Number(price)) : null,
      lead_time_days: leadTime ? Number(leadTime) : null,
      is_available: isAvailable,
    },
    { onConflict: "product_id,supplier_id" },
  );
  if (error) return fail("Could not link product.");
  revalidatePath(`/admin/suppliers/${supplierId}`);
  return ok(undefined, "Product linked.");
}

export async function unlinkProductSupplier(linkId: string, supplierId: string): Promise<ActionResult> {
  try {
    await assertCapability("manageSuppliers");
  } catch (e) {
    return fail((e as Error).message);
  }
  const supabase = await createClient();
  const { error } = await supabase.from("product_suppliers").delete().eq("id", linkId);
  if (error) return fail("Could not unlink.");
  revalidatePath(`/admin/suppliers/${supplierId}`);
  return ok(undefined, "Unlinked.");
}
