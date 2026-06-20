-- Production security hardening (idempotent)

-- ---------------------------------------------------------------------------
-- wallet_tx_type: promotion enum value
-- ---------------------------------------------------------------------------
do $do$ begin
  alter type public.wallet_tx_type add value if not exists 'promotion';
exception when duplicate_object then null;
end $do$;

-- ---------------------------------------------------------------------------
-- Prevent non-admin wallet balance tampering via RLS
-- ---------------------------------------------------------------------------
drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_admin"
  on public.wallets for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
create policy "wallet_transactions_insert_admin"
  on public.wallet_transactions for insert
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Signup role whitelist + prevent role escalation on profile updates
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_full_name text;
  v_role public.user_role;
  v_requested_role text;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );
  v_username := lower(regexp_replace(v_username, '[^a-z0-9_]', '', 'g'));
  if char_length(v_username) < 3 then
    v_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'fullName'), ''),
    v_username
  );

  v_requested_role := lower(coalesce(new.raw_user_meta_data->>'role', 'buyer'));
  v_role := case
    when v_requested_role in ('buyer', 'seller', 'business') then v_requested_role::public.user_role
    else 'buyer'::public.user_role
  end;

  insert into public.profiles (id, username, full_name, email, role)
  values (new.id, v_username, v_full_name, new.email, v_role);

  insert into public.wallets (user_id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  insert into public.notification_settings (user_id) values (new.id);

  if v_role in ('seller', 'business') then
    insert into public.seller_profiles (id) values (new.id)
    on conflict (id) do nothing;
  end if;

  if v_role = 'business' then
    insert into public.business_accounts (id, business_name)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), v_full_name)
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Role changes require admin privileges';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_role_escalation();
