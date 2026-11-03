import Link from "next/link";
import { requireCapability } from "@/lib/auth/guards";
import { getAnalytics } from "@/services/admin/analytics";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export default async function AnalyticsPage() {
  await requireCapability("viewAnalytics");
  const data = await getAnalytics();
  const maxTop = Math.max(1, ...data.topProducts.map((p) => p.inquiryCount));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Based only on real records. Inquiries are not orders; revenue counts verified payments only."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total inquiries" value={data.totals.inquiries} />
        <StatCard label="Confirmed orders" value={data.totals.confirmed} tone="accent" />
        <StatCard label="Verified-paid orders" value={data.totals.verifiedPaid} tone="success" />
        <StatCard label="Newsletter subscribers" value={data.totals.subscribers} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Inquiry → confirmed"
          value={pct(data.conversion.inquiryToConfirmed)}
          hint="Share of inquiries that became confirmed orders."
        />
        <StatCard
          label="Confirmed → paid"
          value={pct(data.conversion.confirmedToPaid)}
          hint="Share of confirmed orders with a verified payment."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inquiries yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.statusDistribution.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="font-medium">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.paymentDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.paymentDistribution.map((s) => (
                  <li key={s.status} className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="font-medium">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Most-inquired products</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.topProducts.map((p) => (
                <li key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium text-brand-terracotta hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {p.inquiryCount} inquiries · {p.viewCount} views
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-terracotta"
                      style={{ width: `${(p.inquiryCount / maxTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
