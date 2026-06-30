-- ROVEXO Row Level Security Policies
-- Idempotent: safe to re-run when partially applied.

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.business_accounts enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.offers enable row level security;
alter table public.saved_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_settings enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdraw_methods enable row level security;
alter table public.reviews enable row level security;
alter table public.user_settings enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- seller_profiles
-- ---------------------------------------------------------------------------
drop policy if exists "seller_profiles_select_public" on public.seller_profiles;
create policy "seller_profiles_select_public"
  on public.seller_profiles for select
  using (true);

drop policy if exists "seller_profiles_insert_own" on public.seller_profiles;
create policy "seller_profiles_insert_own"
  on public.seller_profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "seller_profiles_update_own" on public.seller_profiles;
create policy "seller_profiles_update_own"
  on public.seller_profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "seller_profiles_delete_admin" on public.seller_profiles;
create policy "seller_profiles_delete_admin"
  on public.seller_profiles for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- business_accounts
-- ---------------------------------------------------------------------------
drop policy if exists "business_accounts_select_own" on public.business_accounts;
create policy "business_accounts_select_own"
  on public.business_accounts for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "business_accounts_insert_own" on public.business_accounts;
create policy "business_accounts_insert_own"
  on public.business_accounts for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "business_accounts_update_own" on public.business_accounts;
create policy "business_accounts_update_own"
  on public.business_accounts for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "business_accounts_delete_admin" on public.business_accounts;
create policy "business_accounts_delete_admin"
  on public.business_accounts for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- brands (read-only for users; admin manages)
-- ---------------------------------------------------------------------------
drop policy if exists "brands_select_all" on public.brands;
create policy "brands_select_all"
  on public.brands for select
  using (true);

drop policy if exists "brands_insert_admin" on public.brands;
create policy "brands_insert_admin"
  on public.brands for insert
  with check (public.is_admin());

drop policy if exists "brands_update_admin" on public.brands;
create policy "brands_update_admin"
  on public.brands for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "brands_delete_admin" on public.brands;
create policy "brands_delete_admin"
  on public.brands for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories (read-only for users; admin manages)
-- ---------------------------------------------------------------------------
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  using (true);

drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin"
  on public.categories for insert
  with check (public.is_admin());

drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin"
  on public.categories for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (
    status = 'published'
    or seller_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "products_insert_seller" on public.products;
create policy "products_insert_seller"
  on public.products for insert
  with check (
    seller_id = auth.uid()
    and public.current_user_role() in ('seller', 'business', 'admin')
  );

drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner"
  on public.products for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner"
  on public.products for delete
  using (seller_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- product_images
-- Table created in 20250618000001_foundation_schema.sql
-- Requires explicit GRANTs for Data API access (42501 without them).
-- Policies mirror public.products ownership and visibility rules.
-- ---------------------------------------------------------------------------
grant select on table public.product_images to anon;
grant select, insert, update, delete on table public.product_images to authenticated;
grant all on table public.product_images to service_role;

drop policy if exists "product_images_select" on public.product_images;
create policy "product_images_select"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          p.status = 'published'
          or p.seller_id = auth.uid()
          or public.is_admin()
        )
    )
  );

drop policy if exists "product_images_insert" on public.product_images;
create policy "product_images_insert"
  on public.product_images for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.seller_id = auth.uid()
        and public.current_user_role() in ('seller', 'business', 'admin')
    )
    or public.is_admin()
  );

drop policy if exists "product_images_update" on public.product_images;
create policy "product_images_update"
  on public.product_images for update
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.seller_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "product_images_delete" on public.product_images;
create policy "product_images_delete"
  on public.product_images for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.seller_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- shipping_addresses
-- ---------------------------------------------------------------------------
drop policy if exists "shipping_addresses_select_own" on public.shipping_addresses;
create policy "shipping_addresses_select_own"
  on public.shipping_addresses for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "shipping_addresses_insert_own" on public.shipping_addresses;
create policy "shipping_addresses_insert_own"
  on public.shipping_addresses for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "shipping_addresses_update_own" on public.shipping_addresses;
create policy "shipping_addresses_update_own"
  on public.shipping_addresses for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "shipping_addresses_delete_own" on public.shipping_addresses;
create policy "shipping_addresses_delete_own"
  on public.shipping_addresses for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_participant" on public.orders;
create policy "orders_select_participant"
  on public.orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer"
  on public.orders for insert
  with check (buyer_id = auth.uid() or public.is_admin());

drop policy if exists "orders_update_participant" on public.orders;
create policy "orders_update_participant"
  on public.orders for update
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
  on public.orders for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
drop policy if exists "order_items_select_participant" on public.order_items;
create policy "order_items_select_participant"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_insert_buyer" on public.order_items;
create policy "order_items_insert_buyer"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_update_participant" on public.order_items;
create policy "order_items_update_participant"
  on public.order_items for update
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_delete_admin" on public.order_items;
create policy "order_items_delete_admin"
  on public.order_items for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- offers
-- ---------------------------------------------------------------------------
drop policy if exists "offers_select_participant" on public.offers;
create policy "offers_select_participant"
  on public.offers for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "offers_insert_buyer" on public.offers;
create policy "offers_insert_buyer"
  on public.offers for insert
  with check (buyer_id = auth.uid() or public.is_admin());

drop policy if exists "offers_update_participant" on public.offers;
create policy "offers_update_participant"
  on public.offers for update
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "offers_delete_participant" on public.offers;
create policy "offers_delete_participant"
  on public.offers for delete
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- saved_items
-- ---------------------------------------------------------------------------
drop policy if exists "saved_items_select_own" on public.saved_items;
create policy "saved_items_select_own"
  on public.saved_items for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "saved_items_insert_own" on public.saved_items;
create policy "saved_items_insert_own"
  on public.saved_items for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "saved_items_update_own" on public.saved_items;
create policy "saved_items_update_own"
  on public.saved_items for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own"
  on public.saved_items for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant"
  on public.conversations for insert
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
  on public.conversations for update
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "conversations_delete_admin" on public.conversations;
create policy "conversations_delete_admin"
  on public.conversations for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "messages_update_participant" on public.messages;
create policy "messages_update_participant"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "messages_delete_admin" on public.messages;
create policy "messages_delete_admin"
  on public.messages for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system"
  on public.notifications for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- notification_settings
-- ---------------------------------------------------------------------------
drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
  on public.notification_settings for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
  on public.notification_settings for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
  on public.notification_settings for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notification_settings_delete_admin" on public.notification_settings;
create policy "notification_settings_delete_admin"
  on public.notification_settings for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own"
  on public.wallets for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallets_insert_admin" on public.wallets;
create policy "wallets_insert_admin"
  on public.wallets for insert
  with check (public.is_admin());

drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own"
  on public.wallets for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallets_delete_admin" on public.wallets;
create policy "wallets_delete_admin"
  on public.wallets for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- wallet_transactions
-- ---------------------------------------------------------------------------
drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
create policy "wallet_transactions_insert_own"
  on public.wallet_transactions for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallet_transactions_update_admin" on public.wallet_transactions;
create policy "wallet_transactions_update_admin"
  on public.wallet_transactions for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "wallet_transactions_delete_admin" on public.wallet_transactions;
create policy "wallet_transactions_delete_admin"
  on public.wallet_transactions for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- withdraw_methods
-- ---------------------------------------------------------------------------
drop policy if exists "withdraw_methods_select_own" on public.withdraw_methods;
create policy "withdraw_methods_select_own"
  on public.withdraw_methods for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "withdraw_methods_insert_own" on public.withdraw_methods;
create policy "withdraw_methods_insert_own"
  on public.withdraw_methods for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "withdraw_methods_update_own" on public.withdraw_methods;
create policy "withdraw_methods_update_own"
  on public.withdraw_methods for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "withdraw_methods_delete_own" on public.withdraw_methods;
create policy "withdraw_methods_delete_own"
  on public.withdraw_methods for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_reviewer" on public.reviews;
create policy "reviews_insert_reviewer"
  on public.reviews for insert
  with check (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_update_reviewer" on public.reviews;
create policy "reviews_update_reviewer"
  on public.reviews for update
  using (reviewer_id = auth.uid() or public.is_admin())
  with check (reviewer_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin"
  on public.reviews for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_settings_delete_admin" on public.user_settings;
create policy "user_settings_delete_admin"
  on public.user_settings for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
