-- ============================================================================
-- DASTARA — 0003_rls
-- Row Level Security + least-privilege grants.
--
-- Trust model: customers are NEVER authenticated (guest-only storefront), so
-- the `anon` role == public visitors and the `authenticated` role == signed-in
-- admins. Every table has RLS enabled; privileged tables deny `anon` entirely.
-- ============================================================================

-- Enable RLS everywhere.
alter table admin_profiles        enable row level security;
alter table categories            enable row level security;
alter table products              enable row level security;
alter table product_private       enable row level security;
alter table product_images        enable row level security;
alter table suppliers             enable row level security;
alter table product_suppliers     enable row level security;
alter table customers             enable row level security;
alter table order_inquiries       enable row level security;
alter table order_items           enable row level security;
alter table order_status_history  enable row level security;
alter table payments              enable row level security;
alter table site_settings         enable row level security;
alter table payment_config        enable row level security;
alter table newsletter_subscribers enable row level security;
alter table audit_logs            enable row level security;

-- --------------------------------------------------------------------------
-- Least-privilege table grants. Start from zero for the two web roles.
-- --------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

-- Public visitors: read-only access to safe catalogue tables (RLS narrows rows).
grant select on products, product_images, categories, site_settings to anon;

-- Admins (authenticated): full DML; every statement is still gated by RLS.
grant select, insert, update, delete on
  admin_profiles, categories, products, product_private, product_images,
  suppliers, product_suppliers, customers, order_inquiries, order_items,
  order_status_history, payments, site_settings, payment_config,
  newsletter_subscribers, audit_logs
to authenticated;

-- ============================================================================
-- Policies
-- ============================================================================

-- admin_profiles -----------------------------------------------------------
drop policy if exists admin_profiles_read on admin_profiles;
create policy admin_profiles_read on admin_profiles
  for select to authenticated using (is_admin());

drop policy if exists admin_profiles_write on admin_profiles;
create policy admin_profiles_write on admin_profiles
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- categories ---------------------------------------------------------------
drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories
  for select to anon, authenticated
  using (is_visible = true and is_archived = false);

drop policy if exists categories_admin_read on categories;
create policy categories_admin_read on categories
  for select to authenticated using (is_admin());

drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- products -----------------------------------------------------------------
drop policy if exists products_public_read on products;
create policy products_public_read on products
  for select to anon, authenticated
  using (is_published = true and availability <> 'draft' and availability <> 'archived');

drop policy if exists products_admin_read on products;
create policy products_admin_read on products
  for select to authenticated using (is_admin());

drop policy if exists products_admin_write on products;
create policy products_admin_write on products
  for all to authenticated using (is_admin()) with check (is_admin());

-- product_private (admin only — never anon) --------------------------------
drop policy if exists product_private_admin on product_private;
create policy product_private_admin on product_private
  for all to authenticated using (is_admin()) with check (is_admin());

-- product_images -----------------------------------------------------------
drop policy if exists product_images_public_read on product_images;
create policy product_images_public_read on product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and p.is_published = true
        and p.availability <> 'draft'
        and p.availability <> 'archived'
    )
  );

drop policy if exists product_images_admin on product_images;
create policy product_images_admin on product_images
  for all to authenticated using (is_admin()) with check (is_admin());

-- suppliers + links (operations roles only) --------------------------------
drop policy if exists suppliers_ops on suppliers;
create policy suppliers_ops on suppliers
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

drop policy if exists product_suppliers_ops on product_suppliers;
create policy product_suppliers_ops on product_suppliers
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

-- customers (operations roles only) ----------------------------------------
drop policy if exists customers_ops on customers;
create policy customers_ops on customers
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

-- order_inquiries / items / history / payments (operations roles only) -----
drop policy if exists inquiries_ops on order_inquiries;
create policy inquiries_ops on order_inquiries
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

drop policy if exists order_items_ops on order_items;
create policy order_items_ops on order_items
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

drop policy if exists status_history_ops on order_status_history;
create policy status_history_ops on order_status_history
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

drop policy if exists payments_ops on payments;
create policy payments_ops on payments
  for all to authenticated using (can_manage_operations()) with check (can_manage_operations());

-- site_settings (public read, super-admin write) ---------------------------
drop policy if exists site_settings_public_read on site_settings;
create policy site_settings_public_read on site_settings
  for select to anon, authenticated using (true);

drop policy if exists site_settings_write on site_settings;
create policy site_settings_write on site_settings
  for update to authenticated using (is_super_admin()) with check (is_super_admin());

drop policy if exists site_settings_insert on site_settings;
create policy site_settings_insert on site_settings
  for insert to authenticated with check (is_super_admin());

-- payment_config (operations read, super-admin write) ----------------------
drop policy if exists payment_config_read on payment_config;
create policy payment_config_read on payment_config
  for select to authenticated using (can_manage_operations());

drop policy if exists payment_config_write on payment_config;
create policy payment_config_write on payment_config
  for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- newsletter_subscribers (admin read; writes go through service role) -------
drop policy if exists newsletter_admin_read on newsletter_subscribers;
create policy newsletter_admin_read on newsletter_subscribers
  for select to authenticated using (is_admin());

-- audit_logs (admin read + insert under own session) -----------------------
drop policy if exists audit_logs_read on audit_logs;
create policy audit_logs_read on audit_logs
  for select to authenticated using (is_admin());

drop policy if exists audit_logs_insert on audit_logs;
create policy audit_logs_insert on audit_logs
  for insert to authenticated with check (is_admin());
