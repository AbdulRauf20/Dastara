"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/app/actions/settings";
import { paisaToRupees } from "@/lib/utils";
import type { SiteSettingsRow } from "@/types/database";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettingsRow }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateSettings, null);
  const policies = settings.policies ?? {};

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Contact & WhatsApp">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="whatsappNumber" label="WhatsApp number" defaultValue={settings.whatsapp_number ?? ""} required />
          <Field name="contactPhone" label="Contact phone" defaultValue={settings.contact_phone ?? ""} />
          <Field name="contactEmail" label="Contact email" defaultValue={settings.contact_email ?? ""} />
        </div>
      </Section>

      <Section title="Announcement bar">
        <Field name="announcementText" label="Announcement text" defaultValue={settings.announcement_text ?? ""} />
        <Check name="announcementEnabled" label="Show announcement bar" defaultChecked={settings.announcement_enabled} />
      </Section>

      <Section title="Homepage hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="heroHeadline" label="Headline" defaultValue={settings.hero_headline ?? ""} />
          <Field name="heroCtaLabel" label="CTA label" defaultValue={settings.hero_cta_label ?? ""} />
          <Field name="heroCtaHref" label="CTA link" defaultValue={settings.hero_cta_href ?? ""} />
        </div>
        <TextField name="heroSubtext" label="Subtext" defaultValue={settings.hero_subtext ?? ""} />
      </Section>

      <Section title="Delivery">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="deliveryFee"
            label="Delivery fee (PKR)"
            type="number"
            defaultValue={String(paisaToRupees(settings.delivery_fee_paisa))}
          />
          <Field
            name="freeDeliveryThreshold"
            label="Free delivery over (PKR, blank = none)"
            type="number"
            defaultValue={
              settings.free_delivery_threshold_paisa != null
                ? String(paisaToRupees(settings.free_delivery_threshold_paisa))
                : ""
            }
          />
          <Field name="deliveryEstimate" label="Delivery estimate" defaultValue={settings.delivery_estimate ?? ""} />
        </div>
      </Section>

      <Section title="Social & footer">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="socialInstagram" label="Instagram URL" defaultValue={settings.social_instagram ?? ""} />
          <Field name="socialFacebook" label="Facebook URL" defaultValue={settings.social_facebook ?? ""} />
          <Field name="socialTiktok" label="TikTok URL" defaultValue={settings.social_tiktok ?? ""} />
        </div>
        <TextField name="footerAbout" label="Footer about text" defaultValue={settings.footer_about ?? ""} />
      </Section>

      <Section title="Storefront sections">
        <div className="grid gap-3 sm:grid-cols-2">
          <Check name="trendingEnabled" label="Show trending" defaultChecked={settings.trending_enabled} />
          <Field name="trendingMax" label="Max trending items" type="number" defaultValue={String(settings.trending_max)} />
          <Check name="featuredEnabled" label="Show featured collections" defaultChecked={settings.featured_enabled} />
          <Check name="newArrivalsEnabled" label="Show new arrivals" defaultChecked={settings.new_arrivals_enabled} />
          <Check name="showSoldOut" label="Show sold-out products" defaultChecked={settings.show_sold_out} />
        </div>
      </Section>

      <Section title="Policy pages">
        <TextField name="policyAbout" label="About / Our Story" defaultValue={policies.about ?? ""} rows={5} />
        <TextField name="policyShipping" label="Shipping policy" defaultValue={policies.shipping ?? ""} rows={4} />
        <TextField name="policyReturns" label="Returns policy" defaultValue={policies.returns ?? ""} rows={4} />
        <TextField name="policyCare" label="Care instructions" defaultValue={policies.care ?? ""} rows={4} />
        <TextField name="policyPrivacy" label="Privacy policy" defaultValue={policies.privacy ?? ""} rows={4} />
        <TextField name="policyTerms" label="Terms & conditions" defaultValue={policies.terms ?? ""} rows={4} />
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  rows = 2,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={rows} defaultValue={defaultValue} />
    </div>
  );
}
