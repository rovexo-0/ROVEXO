-- ROVEXO Storage Buckets and Policies
-- Idempotent: safe to re-run when partially applied.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('products', 'products', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('messages', 'messages', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- avatars — public read, owner write
-- Path: {user_id}/avatar.{ext}
-- ---------------------------------------------------------------------------
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- products — public read, seller write own folder
-- Path: {seller_id}/{product_id}/{filename}
-- ---------------------------------------------------------------------------
drop policy if exists "products_storage_select_public" on storage.objects;
create policy "products_storage_select_public"
  on storage.objects for select
  using (bucket_id = 'products');

drop policy if exists "products_storage_insert_seller" on storage.objects;
create policy "products_storage_insert_seller"
  on storage.objects for insert
  with check (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() in ('seller', 'business', 'admin')
  );

drop policy if exists "products_storage_update_seller" on storage.objects;
create policy "products_storage_update_seller"
  on storage.objects for update
  using (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "products_storage_delete_seller" on storage.objects;
create policy "products_storage_delete_seller"
  on storage.objects for delete
  using (
    bucket_id = 'products'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- messages — private, conversation participants only
-- Path: {conversation_id}/{filename}
-- ---------------------------------------------------------------------------
drop policy if exists "messages_storage_select_participant" on storage.objects;
create policy "messages_storage_select_participant"
  on storage.objects for select
  using (
    bucket_id = 'messages'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "messages_storage_insert_participant" on storage.objects;
create policy "messages_storage_insert_participant"
  on storage.objects for insert
  with check (
    bucket_id = 'messages'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "messages_storage_update_participant" on storage.objects;
create policy "messages_storage_update_participant"
  on storage.objects for update
  using (
    bucket_id = 'messages'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "messages_storage_delete_participant" on storage.objects;
create policy "messages_storage_delete_participant"
  on storage.objects for delete
  using (
    bucket_id = 'messages'
    and (
      exists (
        select 1 from public.conversations c
        where c.id::text = (storage.foldername(name))[1]
          and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
      or public.is_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- documents — private, owner only
-- Path: {user_id}/{filename}
-- ---------------------------------------------------------------------------
drop policy if exists "documents_storage_select_own" on storage.objects;
create policy "documents_storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "documents_storage_insert_own" on storage.objects;
create policy "documents_storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "documents_storage_update_own" on storage.objects;
create policy "documents_storage_update_own"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "documents_storage_delete_own" on storage.objects;
create policy "documents_storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );
