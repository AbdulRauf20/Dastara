-- ============================================================================
-- DASTARA — 0004_storage
-- Storage buckets + policies.
--   product-images  : public read, admin write
--   category-images : public read, admin write
--   payment-proofs  : PRIVATE, admin read + write only
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true,  5242880,
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('category-images', 'category-images', true,  5242880,
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('payment-proofs',  'payment-proofs',  false, 5242880,
     array['image/jpeg','image/png','image/webp','image/avif','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------------------------------------
-- Public-read image buckets.
-- --------------------------------------------------------------------------
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'category-images'));

drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'category-images') and is_admin());

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'category-images') and is_admin())
  with check (bucket_id in ('product-images', 'category-images') and is_admin());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'category-images') and is_admin());

-- --------------------------------------------------------------------------
-- Private payment-proofs bucket (operations roles only).
-- --------------------------------------------------------------------------
drop policy if exists "ops read payment proofs" on storage.objects;
create policy "ops read payment proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and can_manage_operations());

drop policy if exists "ops write payment proofs" on storage.objects;
create policy "ops write payment proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and can_manage_operations());

drop policy if exists "ops update payment proofs" on storage.objects;
create policy "ops update payment proofs" on storage.objects
  for update to authenticated
  using (bucket_id = 'payment-proofs' and can_manage_operations())
  with check (bucket_id = 'payment-proofs' and can_manage_operations());

drop policy if exists "ops delete payment proofs" on storage.objects;
create policy "ops delete payment proofs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and can_manage_operations());
