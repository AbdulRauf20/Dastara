import Link from "next/link";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { formatPkPhoneDisplay } from "@/lib/phone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { CustomerRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireCapability("manageCustomers");
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data } = await query.limit(200);
  const customers = (data ?? []) as CustomerRow[];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="People who have inquired. Addresses are private operational data."
      />
      <form className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Search name or phone…" defaultValue={q ?? ""} className="pl-9" />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {q ? "No customers match your search." : "No customers yet."}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium text-brand-terracotta hover:underline"
                    >
                      {c.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatPkPhoneDisplay(c.phone)}</TableCell>
                  <TableCell>{c.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
