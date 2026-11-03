import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteSettings, resolveWhatsappNumber } from "@/services/site";
import { buildGreetingUrl } from "@/lib/whatsapp";
import { formatPkPhoneDisplay } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with DASTARA.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsapp = resolveWhatsappNumber(settings);
  const waUrl = buildGreetingUrl(whatsapp);

  return (
    <div className="container max-w-3xl py-14 sm:py-20">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold sm:text-5xl">We&apos;d love to hear from you</h1>
      <p className="mt-4 text-muted-foreground">
        The fastest way to reach us is on WhatsApp. We typically reply within business hours.
      </p>

      <div className="mt-8">
        <Button asChild size="lg" variant="accent">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
          </a>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <ContactItem icon={MessageCircle} label="WhatsApp" value={formatPkPhoneDisplay(whatsapp)} />
        {settings.contact_email && (
          <ContactItem icon={Mail} label="Email" value={settings.contact_email} href={`mailto:${settings.contact_email}`} />
        )}
        {settings.contact_phone && (
          <ContactItem icon={Phone} label="Phone" value={settings.contact_phone} />
        )}
        <ContactItem icon={MapPin} label="Based in" value="Pakistan — sourcing from interior Sindh" />
      </div>

      <div className="mt-12 rounded-lg bg-brand-ivory/60 p-6 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">How ordering works:</strong> Browse a product and
        submit an order inquiry — no account needed. We&apos;ll confirm availability with the
        artisan, then share payment details over WhatsApp. Your order is confirmed only after
        payment is verified.
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-5">
      <Icon className="mt-0.5 h-5 w-5 text-brand-terracotta" />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}
