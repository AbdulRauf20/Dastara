import "server-only";

import { headers } from "next/headers";
import { createHash } from "crypto";

/**
 * Lightweight in-memory fixed-window rate limiter for public endpoints.
 *
 * NOTE: This is per-instance and resets on cold start. It meaningfully slows
 * casual abuse of the public inquiry endpoint. For stronger guarantees across
 * serverless instances, back this with Upstash/Redis — the interface stays the
 * same. It is paired with a honeypot field and server-side validation.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

/** Best-effort client IP from proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** One-way hash of an IP for privacy-preserving storage. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// Opportunistic cleanup to prevent unbounded growth.
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { __dastaraRlCleanup?: boolean };
  if (!g.__dastaraRlCleanup) {
    g.__dastaraRlCleanup = true;
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }, 5 * 60_000).unref?.();
  }
}
