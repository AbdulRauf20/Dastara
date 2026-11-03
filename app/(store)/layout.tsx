import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import { getSiteSettings, resolveWhatsappNumber } from "@/services/site";
import { getCategories } from "@/services/catalog";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      {settings.announcement_enabled && (
        <AnnouncementBar text={settings.announcement_text} />
      )}
      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} settings={settings} />
      <WhatsAppFloat businessNumber={resolveWhatsappNumber(settings)} />
    </div>
  );
}
