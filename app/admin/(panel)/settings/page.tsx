import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { PaymentConfigForm } from "@/components/admin/payment-config-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteSettingsRow, PaymentConfigRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCapability("manageSettings");
  const supabase = await createClient();

  const [{ data: settingsData }, { data: paymentData }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("payment_config").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (!settingsData || !paymentData) {
    return (
      <div>
        <PageHeader title="Settings" />
        <p className="text-sm text-destructive">
          Settings rows are missing. Run the seed migration (supabase/seed/seed.sql) to initialise them.
        </p>
      </div>
    );
  }

  const settings = settingsData as SiteSettingsRow;
  const payment = paymentData as PaymentConfigRow;

  return (
    <div>
      <PageHeader title="Settings" description="Control storefront content, delivery, and payment details." />
      <Tabs defaultValue="site">
        <TabsList>
          <TabsTrigger value="site">Website</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="site" className="mt-6">
          <SettingsForm settings={settings} />
        </TabsContent>
        <TabsContent value="payment" className="mt-6">
          <PaymentConfigForm config={payment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
