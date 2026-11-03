import { publicEnv } from "@/lib/env";

export const BUCKETS = {
  product: "product-images",
  category: "category-images",
  paymentProof: "payment-proofs",
} as const;

/** Build a public URL for an object in a public bucket. */
export function publicStorageUrl(
  bucket: string,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = publicEnv.supabaseUrl.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function productImageUrl(path: string | null | undefined): string | null {
  return publicStorageUrl(BUCKETS.product, path);
}

export function categoryImageUrl(path: string | null | undefined): string | null {
  return publicStorageUrl(BUCKETS.category, path);
}

/** Allowed image upload types + max size, enforced on the server. */
export const IMAGE_UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
} as const;

export function isAllowedImage(file: { type: string; size: number }): string | null {
  if (!IMAGE_UPLOAD.acceptedTypes.includes(file.type as never)) {
    return "Only JPEG, PNG, WebP, or AVIF images are allowed.";
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) {
    return "Images must be 5MB or smaller.";
  }
  return null;
}
