-- ============================================================================
-- DASTARA — 0002_functions
-- Triggers (updated_at, SKU/order-ref generation + immutability) and the
-- SECURITY DEFINER authorization helpers used by RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generic updated_at maintenance.
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'admin_profiles','categories','products','product_private','suppliers',
    'product_suppliers','customers','order_inquiries','payments',
    'site_settings','payment_config'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on %1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$s
         for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Permanent SKU generation (DAS-P-000001). Never index-based, never reused.
-- ----------------------------------------------------------------------------
create or replace function generate_product_sku()
returns trigger language plpgsql as $$
begin
  if new.sku is null or length(trim(new.sku)) = 0 then
    new.sku := 'DAS-P-' || lpad(nextval('product_sku_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_sku on products;
create trigger trg_products_sku before insert on products
  for each row execute function generate_product_sku();

-- SKU is permanent: block any change after creation.
create or replace function prevent_sku_change()
returns trigger language plpgsql as $$
begin
  if new.sku is distinct from old.sku then
    raise exception 'Product SKU is permanent and cannot be changed (% -> %)', old.sku, new.sku;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_sku_immutable on products;
create trigger trg_products_sku_immutable before update on products
  for each row execute function prevent_sku_change();

-- Maintain published_at the first time a product is published.
create or replace function sync_published_at()
returns trigger language plpgsql as $$
begin
  if new.is_published and old.is_published is distinct from true and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_published_at on products;
create trigger trg_products_published_at before update on products
  for each row execute function sync_published_at();

-- ----------------------------------------------------------------------------
-- Concurrency-safe order reference generation (DAS-000123).
-- ----------------------------------------------------------------------------
create or replace function generate_order_ref()
returns trigger language plpgsql as $$
begin
  if new.order_ref is null or length(trim(new.order_ref)) = 0 then
    new.order_ref := 'DAS-' || lpad(nextval('order_ref_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_inquiries_ref on order_inquiries;
create trigger trg_inquiries_ref before insert on order_inquiries
  for each row execute function generate_order_ref();

-- ----------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER => bypass RLS to avoid recursion).
-- ----------------------------------------------------------------------------
create or replace function current_admin_role()
returns admin_role
language sql stable security definer set search_path = public as $$
  select role from admin_profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true and role = 'super_admin'
  );
$$;

-- Can this admin manage operational data (orders, payments, suppliers)?
create or replace function can_manage_operations()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true and role in ('super_admin','admin')
  );
$$;

-- ----------------------------------------------------------------------------
-- Public, rate-limited-at-app-layer view counter. Callable by anon via RPC.
-- SECURITY DEFINER so anon never needs UPDATE on products.
-- ----------------------------------------------------------------------------
create or replace function increment_product_view(p_product_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update products
     set view_count = view_count + 1
   where id = p_product_id and is_published = true;
end;
$$;

revoke all on function increment_product_view(uuid) from public;
grant execute on function increment_product_view(uuid) to anon, authenticated;

-- Increment the real inquiry counter (used for honest "popular" sorting and
-- analytics). Called only from trusted server code (service role).
create or replace function increment_product_inquiry(p_product_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update products
     set inquiry_count = inquiry_count + 1
   where id = p_product_id;
end;
$$;

revoke all on function increment_product_inquiry(uuid) from public;
