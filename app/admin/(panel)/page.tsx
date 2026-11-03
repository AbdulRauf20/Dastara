import Link from "next/link";
import { getCurrentAdmin, roleCan } from "@/lib/auth/guards";
import { getDashboardStats } from "@/services/admin/stats";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getCurrentAdmin();
  const stats = await getDashboardStats();
  const canSeeFinancials = session ? roleCan(session.profile.role, "viewFinancials") : false;

  return (
    <div>
      <PageHeader
        title={`Welcome back${session?.profile.full_name ? `, ${session.profile.full_name.split(" ")[0]}` : ""}`}
        description="A real-time overview from your live records."
        action={
          <Button asChild>
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        }
      />

      {/* Orders pipeline */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Orders & Inquiries
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total inquiries" value={stats.orders.totalInquiries} />
        <StatCard label="New inquiries" value={stats.orders.newInquiries} tone="accent" hint="Need review" />
        <StatCard label="Confirmed orders" value={stats.orders.confirmedOrders} />
        <StatCard label="Awaiting payment" value={stats.orders.awaitingPayment} tone="warning" />
        <StatCard label="Paid orders" value={stats.orders.paidOrders} tone="success" />
        <StatCard label="Dispatched" value={stats.orders.dispatched} />
      </div>

      {/* Finance */}
      {canSeeFinancials && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Finance (verified only)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Revenue (verified payments)"
              value={formatPKR(stats.finance.verifiedRevenuePaisa)}
              tone="success"
              hint="Sum of payments explicitly verified by an admin"
            />
            <StatCard
              label="Estimated profit"
              value={
                stats.finance.estimatedProfitPaisa === null
                  ? "—"
                  : formatPKR(stats.finance.estimatedProfitPaisa)
              }
              hint={
                stats.finance.estimatedProfitPaisa === null
                  ? `Add cost data to all paid items to estimate (${stats.finance.profitCoverage.withCost}/${stats.finance.profitCoverage.total} covered)`
                  : "Estimate from recorded supplier/packaging/delivery costs"
              }
            />
          </div>
        </>
      )}

      {/* Catalogue */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Catalogue
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total products" value={stats.products.total} />
        <StatCard label="Published" value={stats.products.published} />
        <StatCard label="Available" value={stats.products.available} />
        <StatCard label="Sold out" value={stats.products.soldOut} />
        <StatCard label="Trending" value={stats.products.trending} />
        <StatCard label="Categories" value={stats.catalog.categories} />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Honest metrics:</strong> inquiries are not
          counted as orders, and revenue reflects only payments you have explicitly verified.
          Estimated profit appears only when cost data exists for all paid items.
        </p>
      </div>
    </div>
  );
}
