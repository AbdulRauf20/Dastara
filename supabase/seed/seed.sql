-- ============================================================================
-- DASTARA — seed
-- Safe, non-fabricated defaults: the singleton settings rows and the initial
-- category taxonomy. NO fake products, prices, trending lists, or analytics.
-- Run after migrations. Idempotent.
-- ============================================================================

-- Singleton site settings (public-safe defaults the admin can edit later).
insert into site_settings (
  id, whatsapp_number, contact_email, announcement_text, announcement_enabled,
  hero_headline, hero_subtext, hero_cta_label, hero_cta_href,
  delivery_estimate, delivery_fee_paisa, footer_about,
  trending_enabled, trending_max, featured_enabled, new_arrivals_enabled,
  show_sold_out, sections, policies
) values (
  1,
  '923453412201',
  'hello@dastara.pk',
  'Handmade. Thoughtfully Found. — Free delivery on confirmed orders over Rs. 5,000.',
  true,
  'Made by hand. Chosen with care.',
  'Discover thoughtfully sourced handmade pieces that bring craftsmanship, culture, and character into everyday life.',
  'Explore Collection',
  '/shop',
  'Typically delivered within 5–9 working days after payment verification.',
  25000,
  'DASTARA discovers handmade products from local artisans across Pakistan, beginning in interior Sindh, and brings them to you with care.',
  true, 8, true, true, true,
  jsonb_build_object(
    'featured_collections', jsonb_build_object('enabled', true, 'order', 1),
    'trending',             jsonb_build_object('enabled', true, 'order', 2),
    'new_arrivals',         jsonb_build_object('enabled', true, 'order', 3),
    'philosophy',           jsonb_build_object('enabled', true, 'order', 4),
    'artisan_stories',      jsonb_build_object('enabled', true, 'order', 5),
    'why_dastara',          jsonb_build_object('enabled', true, 'order', 6),
    'newsletter',           jsonb_build_object('enabled', true, 'order', 7)
  ),
  jsonb_build_object(
    'about',    'DASTARA discovers handmade products from local artisans, beginning in interior Sindh, Pakistan. Each piece is listed with the maker''s permission and sourced on demand to support small-batch, low-waste craftsmanship.',
    'shipping', 'We deliver across Pakistan. Because items are sourced on demand, delivery timelines begin after your payment is verified. Estimated delivery is 5–9 working days unless stated otherwise on the product.',
    'returns',  'As handmade pieces are procured on demand per order, returns are limited. If an item arrives damaged or significantly different from its description, contact us within 48 hours of delivery and we will make it right.',
    'care',     'Handle handmade textiles gently. Dry clean or hand wash cold unless the product specifies otherwise. Dry in shade to preserve natural dyes.',
    'privacy',  'We collect only the information needed to process your order inquiry (name, WhatsApp number, delivery address). We never sell your data. Supplier and payment details are kept strictly private.',
    'terms',    'Submitting an inquiry is a request, not a confirmed order. Orders are confirmed only after we verify product availability with the artisan/supplier and receive verified advance payment.'
  )
) on conflict (id) do nothing;

-- Singleton private payment configuration (admin fills real details later).
insert into payment_config (id, payment_instructions, bank_details, easypaisa_details, jazzcash_details)
values (
  1,
  'Full advance payment is requested only after we confirm product availability. We will share account details over WhatsApp once your order is confirmed.',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Initial category taxonomy (safe, non-fabricated).
insert into categories (name, slug, description, display_order, is_visible) values
  ('Ralli & Textiles',   'ralli-textiles',   'Handmade Ralli quilts and traditional textiles.', 1, true),
  ('Chaddars & Shawls',  'chaddars-shawls',  'Handwoven chaddars and shawls.',                  2, true),
  ('Bags & Accessories', 'bags-accessories', 'Handmade bags and everyday accessories.',         3, true),
  ('Home & Living',      'home-living',      'Thoughtful pieces for the home.',                 4, true),
  ('Art & Decor',        'art-decor',        'Decorative and artistic objects.',                5, true),
  ('Handmade Gifts',     'handmade-gifts',   'Curated handmade gifts.',                         6, true)
on conflict (slug) do nothing;
