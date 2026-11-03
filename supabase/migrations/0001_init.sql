-- ============================================================================
-- DASTARA — 0001_init
-- Extensions, enums, sequences, tables, indexes.
-- Money is stored as BIGINT minor units (paisa) to avoid floating-point error.
-- Currency is PKR throughout.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- fuzzy search on names/SKUs

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type admin_role as enum ('super_admin', 'admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_availability as enum
    ('available', 'sold_out', 'made_to_order', 'coming_soon', 'draft', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'inquiry_received',
    'availability_verification',
    'availability_confirmed',
    'awaiting_payment',
    'payment_verified',
    'procurement_in_progress',
    'quality_inspection',
    'packaging',
    'dispatched',
    'delivered',
    'cancelled',
    'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum
    ('not_requested', 'awaiting_payment', 'proof_received', 'verified', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum
    ('bank_transfer', 'easypaisa', 'jazzcash', 'other');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Sequences for permanent, concurrency-safe identifiers.
-- Values are never reused (deleting a product does not free its SKU number).
-- ----------------------------------------------------------------------------
create sequence if not exists product_sku_seq start 1;
create sequence if not exists order_ref_seq start 1;

-- ----------------------------------------------------------------------------
-- admin_profiles — mirrors auth.users for authorized staff only.
-- ----------------------------------------------------------------------------
create table if not exists admin_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        admin_role not null default 'editor',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  image_path    text,
  display_order integer not null default 0,
  is_visible    boolean not null default true,
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists categories_visible_idx on categories (is_visible, is_archived);
create index if not exists categories_order_idx on categories (display_order);

-- ----------------------------------------------------------------------------
-- products — public-safe columns only. Private financials live in
-- product_private (admin-only) so they can never leak via the public API.
-- ----------------------------------------------------------------------------
create table if not exists products (
  id                   uuid primary key default gen_random_uuid(),
  sku                  text not null unique,
  slug                 text not null unique,
  name                 text not null,
  description          text,
  category_id          uuid references categories (id) on delete set null,
  availability         product_availability not null default 'draft',
  is_published         boolean not null default false,
  price_paisa          bigint not null default 0 check (price_paisa >= 0),
  original_price_paisa bigint check (original_price_paisa >= 0),
  currency             text not null default 'PKR',
  material             text,
  dimensions           text,
  color                text,
  care_instructions    text,
  origin_note          text,
  origin_verified      boolean not null default false,
  is_trending          boolean not null default false,
  trending_order       integer,
  is_featured          boolean not null default false,
  featured_order       integer,
  is_new_arrival       boolean not null default false,
  new_arrival_order    integer,
  display_order        integer not null default 0,
  view_count           bigint not null default 0,
  inquiry_count        bigint not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  published_at         timestamptz
);
create index if not exists products_published_idx on products (is_published, availability);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_trending_idx on products (is_trending, trending_order);
create index if not exists products_featured_idx on products (is_featured, featured_order);
create index if not exists products_new_idx on products (is_new_arrival, new_arrival_order);
create index if not exists products_price_idx on products (price_paisa);
create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists products_sku_trgm_idx on products using gin (sku gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- product_private — supplier cost, packaging, internal notes. ADMIN ONLY.
-- ----------------------------------------------------------------------------
create table if not exists product_private (
  product_id         uuid primary key references products (id) on delete cascade,
  supplier_cost_paisa bigint check (supplier_cost_paisa >= 0),
  packaging_cost_paisa bigint check (packaging_cost_paisa >= 0),
  delivery_cost_paisa  bigint check (delivery_cost_paisa >= 0),
  internal_notes      text,
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- product_images
-- ----------------------------------------------------------------------------
create table if not exists product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products (id) on delete cascade,
  storage_path  text not null,
  alt_text      text,
  display_order integer not null default 0,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images (product_id, display_order);
-- At most one primary image per product.
create unique index if not exists product_images_one_primary
  on product_images (product_id) where is_primary;

-- ----------------------------------------------------------------------------
-- suppliers (private)
-- ----------------------------------------------------------------------------
create table if not exists suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_name  text,
  phone         text,
  email         text,
  location      text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists product_suppliers (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references products (id) on delete cascade,
  supplier_id          uuid not null references suppliers (id) on delete cascade,
  supplier_price_paisa bigint check (supplier_price_paisa >= 0),
  is_available         boolean not null default true,
  lead_time_days       integer,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (product_id, supplier_id)
);
create index if not exists product_suppliers_product_idx on product_suppliers (product_id);
create index if not exists product_suppliers_supplier_idx on product_suppliers (supplier_id);

-- ----------------------------------------------------------------------------
-- customers — derived from inquiries. No login accounts. (private)
-- ----------------------------------------------------------------------------
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null unique,        -- normalized international format
  phone_raw   text,
  email       text,
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists customers_name_trgm_idx on customers using gin (full_name gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- order_inquiries — guest inquiries with full snapshots. (private)
-- ----------------------------------------------------------------------------
create table if not exists order_inquiries (
  id                   uuid primary key default gen_random_uuid(),
  order_ref            text not null unique,
  customer_id          uuid references customers (id) on delete set null,
  customer_name        text not null,
  customer_phone       text not null,
  city                 text not null,
  delivery_address     text not null,
  preferred_variant    text,
  special_instructions text,
  gift_message         text,
  subtotal_paisa       bigint not null check (subtotal_paisa >= 0),
  delivery_fee_paisa   bigint not null default 0 check (delivery_fee_paisa >= 0),
  total_paisa          bigint not null check (total_paisa >= 0),
  currency             text not null default 'PKR',
  status               order_status not null default 'inquiry_received',
  payment_status       payment_status not null default 'not_requested',
  admin_notes          text,
  source               text not null default 'storefront',
  ip_hash              text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists inquiries_status_idx on order_inquiries (status);
create index if not exists inquiries_payment_idx on order_inquiries (payment_status);
create index if not exists inquiries_created_idx on order_inquiries (created_at desc);
create index if not exists inquiries_customer_idx on order_inquiries (customer_id);
create index if not exists inquiries_ref_trgm_idx on order_inquiries using gin (order_ref gin_trgm_ops);
create index if not exists inquiries_phone_trgm_idx on order_inquiries using gin (customer_phone gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- order_items — immutable product snapshots.
-- ----------------------------------------------------------------------------
create table if not exists order_items (
  id               uuid primary key default gen_random_uuid(),
  inquiry_id       uuid not null references order_inquiries (id) on delete cascade,
  product_id       uuid references products (id) on delete set null,
  product_name     text not null,
  product_sku      text not null,
  unit_price_paisa bigint not null check (unit_price_paisa >= 0),
  quantity         integer not null check (quantity > 0),
  line_total_paisa bigint not null check (line_total_paisa >= 0),
  image_path       text,
  created_at       timestamptz not null default now()
);
create index if not exists order_items_inquiry_idx on order_items (inquiry_id);
create index if not exists order_items_product_idx on order_items (product_id);

-- ----------------------------------------------------------------------------
-- order_status_history — audit trail of status transitions.
-- ----------------------------------------------------------------------------
create table if not exists order_status_history (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references order_inquiries (id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  note        text,
  changed_by  uuid references admin_profiles (id) on delete set null,
  changed_by_email text,
  created_at  timestamptz not null default now()
);
create index if not exists status_history_inquiry_idx on order_status_history (inquiry_id, created_at);

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  inquiry_id      uuid not null references order_inquiries (id) on delete cascade,
  amount_paisa    bigint not null check (amount_paisa >= 0),
  method          payment_method,
  status          payment_status not null default 'awaiting_payment',
  transaction_ref text,
  proof_path      text,
  payment_date    timestamptz,
  verified_at     timestamptz,
  verified_by     uuid references admin_profiles (id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists payments_inquiry_idx on payments (inquiry_id);
create index if not exists payments_status_idx on payments (status);

-- ----------------------------------------------------------------------------
-- site_settings — PUBLIC-safe storefront configuration (singleton).
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  id                     integer primary key default 1 check (id = 1),
  whatsapp_number        text,
  contact_email          text,
  contact_phone          text,
  announcement_text      text,
  announcement_enabled   boolean not null default true,
  hero_headline          text,
  hero_subtext           text,
  hero_cta_label         text,
  hero_cta_href          text,
  hero_image_path        text,
  social_instagram       text,
  social_facebook        text,
  social_tiktok          text,
  delivery_fee_paisa     bigint not null default 0 check (delivery_fee_paisa >= 0),
  delivery_estimate      text,
  free_delivery_threshold_paisa bigint check (free_delivery_threshold_paisa >= 0),
  footer_about           text,
  trending_enabled       boolean not null default true,
  trending_max           integer not null default 8,
  featured_enabled       boolean not null default true,
  new_arrivals_enabled   boolean not null default true,
  show_sold_out          boolean not null default true,
  sections               jsonb not null default '{}'::jsonb,
  policies               jsonb not null default '{}'::jsonb,
  updated_at             timestamptz not null default now(),
  updated_by             uuid references admin_profiles (id) on delete set null
);

-- ----------------------------------------------------------------------------
-- payment_config — PRIVATE payment account details (singleton, admin only).
-- ----------------------------------------------------------------------------
create table if not exists payment_config (
  id                   integer primary key default 1 check (id = 1),
  payment_instructions text,
  bank_details         text,
  easypaisa_details    text,
  jazzcash_details     text,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references admin_profiles (id) on delete set null
);

-- ----------------------------------------------------------------------------
-- newsletter_subscribers
-- ----------------------------------------------------------------------------
create table if not exists newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs — sensitive admin actions.
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references admin_profiles (id) on delete set null,
  actor_email text,
  action      text not null,
  entity_type text,
  entity_id   text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);
