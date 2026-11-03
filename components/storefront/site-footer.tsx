import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { storeNav, policyNav, siteConfig } from "@/lib/constants";
import type { CategoryRow } from "@/types/database";
import type { SiteSettingsRow } from "@/types/database";

export function SiteFooter({
  categories,
  settings,
}: {
  categories: CategoryRow[];
  settings: SiteSettingsRow;
}) {
  return (
    <footer className="mt-24 border-t border-border bg-brand-charcoal text-brand-ivory">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4 md:col-span-1">
          <p className="wordmark text-xl">DASTARA</p>
          <p className="text-sm leading-relaxed text-brand-ivory/70">
            {settings.footer_about ?? siteConfig.description}
          </p>
          <div className="flex gap-3 pt-2">
            {settings.social_instagram && (
              <a
                href={settings.social_instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-brand-ivory/70 hover:text-brand-ivory"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings.social_facebook && (
              <a
                href={settings.social_facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-brand-ivory/70 hover:text-brand-ivory"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-brand-ivory/60">
            Explore
          </h3>
          <ul className="space-y-2.5 text-sm">
            {storeNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-brand-ivory/80 hover:text-brand-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-brand-ivory/60">
            Collections
          </h3>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="text-brand-ivory/80 hover:text-brand-ivory"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-brand-ivory/60">
            Customer Care
          </h3>
          <ul className="space-y-2.5 text-sm">
            {policyNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-brand-ivory/80 hover:text-brand-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-brand-ivory/80 hover:text-brand-ivory">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-ivory/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-ivory/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}
          </p>
          <p>Prices in PKR. Orders confirmed after availability check &amp; verified payment.</p>
        </div>
      </div>
    </footer>
  );
}
