import "server-only";

import { createClient } from "@/lib/supabase/server";

interface AuditEntry {
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record a sensitive admin action. Runs under the admin's own RLS session
 * (audit_logs_insert policy requires is_admin()). Failures are swallowed so
 * auditing never blocks the primary operation, but are logged to the server.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to record entry", entry.action, err);
  }
}
