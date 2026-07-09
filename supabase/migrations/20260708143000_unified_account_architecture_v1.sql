-- ROVEXO Unified Account Architecture v1.0
-- Email is the sole unique account identifier at registration.
-- Personal details and payout bank accounts may repeat across accounts.
-- profiles.role remains an internal permission tier, not a separate account type.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_full_name text;
  v_suffix text;
begin
  v_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  if char_length(v_username) < 3 then
    v_username := 'user';
  end if;

  -- Ensure username uniqueness per account (email remains the true unique key).
  v_suffix := substr(replace(new.id::text, '-', ''), 1, 6);
  v_username := left(v_username, 24) || v_suffix;

  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'fullName'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, username, full_name, email, role)
  values (new.id, v_username, v_full_name, new.email, 'buyer');

  insert into public.wallets (user_id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  insert into public.notification_settings (user_id) values (new.id);

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a unified ROVEXO account (wallet + settings). Role defaults to buyer permission tier; capabilities unlock by action.';
