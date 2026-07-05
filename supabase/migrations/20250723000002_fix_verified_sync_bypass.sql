-- Allow trusted system paths (email confirm sync, service role, demo bootstrap) to set verified.

create or replace function public.prevent_profile_verified_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('rovexo.bypass_verified_guard', true) = 'on'
    or current_setting('rovexo.bypass_role_guard', true) = 'on' then
    return new;
  end if;

  if coalesce(auth.jwt()->>'role', '') = 'service_role' then
    return new;
  end if;

  if new.verified is distinct from old.verified then
    if not public.is_admin() then
      raise exception 'Verification changes require admin privileges';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
    and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    perform set_config('rovexo.bypass_verified_guard', 'on', true);

    update public.profiles
    set verified = true,
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;
