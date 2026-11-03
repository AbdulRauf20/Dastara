import Link from "next/link";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatPkPhoneDisplay } from "@/lib/phone";
import { PageHeader } from "@/components/admin/page-header";
import { SupplierCreateButton } from "@/components/admin/supplier-create-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SupplierRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  await requireCapability("manageSuppliers");
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").order("name");
  const suppliers = (data ?? []) as SupplierRow[];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Private supplier directory. Never exposed to customers."
        action={<SupplierCreateButton />}
      />
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No suppliers yet.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/suppliers/${s.id}`} className="font-medium text-brand-terracotta hover:underline">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.contact_name && <p>{s.contact_name}</p>}
                    {s.phone && <p className="text-muted-foreground">{formatPkPhoneDisplay(s.phone)}</p>}
                  </TableCell>
                  <TableCell>{s.location ?? "—"}</TableCell>
                  <TableCell>
                    {s.is_active ? <Badge variant="accent">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
