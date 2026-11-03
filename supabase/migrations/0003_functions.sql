-- ============================================================================
-- DASTARA — 0003 Functions (auth helpers, order submission RPC, counters)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Role / authorization helpers (SECURITY DEFINER so RLS policies can call them
-- without recursive policy evaluation on admin_profiles).
-- ----------------------------------------------------------------------------

-- Numeric privilege rank: super_admin=3, admin=2, editor=1.
create or replace function admin_rank(r admin_role)
returns integer language sql immutable as $$
  select case r
    when 'super_admin' then 3
    when 'admin' then 2
    when 'editor' then 1
    else 0 end;
$$;

-- True if the current authenticated user is an active admin of any role.
create or replace function is_active_admin()
returns boolean
language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- Current user's role (null if not an admin).
create or replace function current_admin_role()
returns admin_role
language sql stable security definer
set search_path = public, pg_temp as $$
  select role from admin_profiles
  where id = auth.uid() and is_active = true;
$$;

-- True if the current user is an active admin with at least the required rank.
create or replace function has_min_rank(required integer)
returns boolean
language sql stable security definer
set search_path = public, pg_temp as $$
  select coalesce(
    (select admin_rank(role) >= required
       from admin_profiles
      where id = auth.uid() and is_active = true),
    false);
$$;

-- Convenience wrappers.
create or replace function is_editor_or_above() returns boolean
  language sql stable as $$ select has_min_rank(1); $$;
create or replace function is_admin_or_above() returns boolean
  language sql stable as $$ select has_min_rank(2); $$;
create or replace function is_super_admin() returns boolean
  language sql stable as $$ select has_min_rank(3); $$;

-- ----------------------------------------------------------------------------
-- increment_product_view — safe public counter bump (no row data exposed)
-- ----------------------------------------------------------------------------
create or replace function increment_product_view(p_product_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  update products
     set view_count = view_count + 1
   where id = p_product_id
     and is_published = true
     and status <> 'draft'
     and status <> 'archived';
end;
$$;
grant execute on function increment_product_view(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- submit_order_inquiry — the single, atomic, server-authoritative order path.
--
-- SECURITY DEFINER: runs with elevated rights so guests (anon) can create an
-- inquiry WITHOUT broad insert grants. Price & availability are ALWAYS taken
-- from the database; browser-submitted prices are never trusted. The whole
-- operation is one transaction — the inquiry/items/history are persisted
-- before the function returns, so the WhatsApp redirect only happens after a
-- confirmed DB write.
-- ----------------------------------------------------------------------------
create or replace function submit_order_inquiry(
  p_product_id          uuid,
  p_quantity            integer,
  p_customer_name       text,
  p_customer_phone      text,
  p_city                text,
  p_delivery_address    text,
  p_preferred_variant   text default null,
  p_special_instructions text default null,
  p_gift_message        text default null
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_product        products%rowtype;
  v_customer_id    uuid;
  v_inquiry_id     uuid;
  v_order_ref      text;
  v_delivery       numeric(12,2);
  v_subtotal       numeric(12,2);
  v_total          numeric(12,2);
  v_name           text := nullif(btrim(p_customer_name), '');
  v_phone          text := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g');
  v_city           text := nullif(btrim(p_city), '');
  v_address        text := nullif(btrim(p_delivery_address), '');
begin
  -- --- Validation -----------------------------------------------------------
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'INVALID_QUANTITY' using errcode = 'check_violation';
  end if;
  if v_name is null then
    raise exception 'INVALID_NAME' using errcode = 'check_violation';
  end if;
  if length(v_phone) < 11 or length(v_phone) > 15 then
    raise exception 'INVALID_PHONE' using errcode = 'check_violation';
  end if;
  if v_city is null then
    raise exception 'INVALID_CITY' using errcode = 'check_violation';
  end if;
  if v_address is null or length(v_address) < 8 then
    raise exception 'INVALID_ADDRESS' using errcode = 'check_violation';
  end if;

  -- --- Fetch + lock the product; validate orderability ----------------------
  select * into v_product from products
   where id = p_product_id for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_product.is_published = false
     or v_product.status not in ('available', 'made_to_order') then
    raise exception 'PRODUCT_NOT_ORDERABLE' using errcode = 'check_violation';
  end if;

  -- --- Authoritative pricing (from DB, never from the browser) --------------
  select coalesce(delivery_charge_default, 0) into v_delivery from site_settings where id = true;
  v_delivery  := coalesce(v_delivery, 0);
  v_subtotal  := v_product.selling_price * p_quantity;
  v_total     := v_subtotal + v_delivery;

  -- --- Upsert customer (by normalized phone; no login account) --------------
  insert into customers (full_name, phone, phone_raw, city)
  values (v_name, v_phone, p_customer_phone, v_city)
  on conflict (phone) do update
    set full_name = excluded.full_name,
        city      = coalesce(excluded.city, customers.city),
        updated_at = now()
  returning id into v_customer_id;

  -- --- Create inquiry -------------------------------------------------------
  insert into order_inquiries (
    customer_id, customer_name, customer_phone, city, delivery_address,
    preferred_variant, special_instructions, gift_message,
    subtotal, delivery_charge, total_amount, currency
  ) values (
    v_customer_id, v_name, v_phone, v_city, v_address,
    nullif(btrim(p_preferred_variant), ''),
    nullif(btrim(p_special_instructions), ''),
    nullif(btrim(p_gift_message), ''),
    v_subtotal, v_delivery, v_total, 'PKR'
  ) returning id, order_reference into v_inquiry_id, v_order_ref;

  -- --- Order item snapshot --------------------------------------------------
  insert into order_items (
    inquiry_id, product_id, product_name, product_sku,
    unit_price, quantity, line_total
  ) values (
    v_inquiry_id, v_product.id, v_product.name, v_product.sku,
    v_product.selling_price, p_quantity, v_subtotal
  );

  -- --- Initial status history ----------------------------------------------
  insert into order_status_history (inquiry_id, from_status, to_status, note)
  values (v_inquiry_id, null, 'inquiry_received', 'Inquiry submitted by customer');

  -- --- Popularity counter ---------------------------------------------------
  update products set inquiry_count = inquiry_count + 1 where id = v_product.id;

  return jsonb_build_object(
    'id',              v_inquiry_id,
    'order_reference', v_order_ref,
    'product_id',      v_product.id,
    'product_sku',     v_product.sku,
    'product_name',    v_product.name,
    'unit_price',      v_product.selling_price,
    'quantity',        p_quantity,
    'subtotal',        v_subtotal,
    'delivery_charge', v_delivery,
    'total_amount',    v_total,
    'currency',        'PKR'
  );
end;
$$;
grant execute on function submit_order_inquiry(
  uuid, integer, text, text, text, text, text, text, text
) to anon, authenticated;
