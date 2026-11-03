import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve the canonical site URL for absolute links (SEO, OG, sitemap).
 * Falls back to the Vercel URL, then localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/**
 * Format an amount stored in PKR minor units (paisa) as a display string.
 * We always store/compute money as integers to avoid floating-point errors.
 */
export function formatPKR(
  paisa: number | null | undefined,
  opts: { withDecimals?: boolean } = {},
): string {
  if (paisa === null || paisa === undefined || Number.isNaN(paisa)) {
    return "—";
  }
  const rupees = paisa / 100;
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: opts.withDecimals ? 2 : 0,
    maximumFractionDigits: opts.withDecimals ? 2 : 0,
  }).format(rupees);
  return `Rs. ${formatted}`;
}

/** Convert a rupee amount (possibly decimal) to integer paisa safely. */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert integer paisa to a rupee number (for form inputs). */
export function paisaToRupees(paisa: number | null | undefined): number {
  if (paisa === null || paisa === undefined) return 0;
  return paisa / 100;
}

/** Create a URL-safe slug from a string. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Format an ISO date string for display. */
export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PK", opts).format(date);
}

/** Format a date + time for admin tables. */
export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Truncate text to a maximum length with an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Safely coerce an unknown value to a trimmed string. */
export function asTrimmedString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Simple initials helper (for avatars). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
