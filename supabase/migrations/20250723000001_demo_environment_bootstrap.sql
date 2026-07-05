-- ROVEXO Demo / UAT environment — service-role bootstrap for staff roles only.

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('rovexo.bypass_role_guard', true) = 'on' then
    return new;
  end if;

  if new.role is distinct from old.role then
    if not public.is_super_admin() then
      raise exception 'Role changes require Super Admin privileges';
    end if;

    if new.role = 'admin'::public.user_role then
      raise exception 'Admin accounts are disabled. ROVEXO uses a single Super Admin account.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.bootstrap_demo_platform_role(
  p_user_id uuid,
  p_target_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_role not in ('admin', 'super_admin') then
    raise exception 'bootstrap_demo_platform_role only supports admin or super_admin';
  end if;

  perform set_config('rovexo.bypass_role_guard', 'on', true);

  update public.profiles
  set
    role = p_target_role,
    verified = true,
    account_status = 'active'
  where id = p_user_id;

  if not found then
    raise exception 'Demo bootstrap user not found: %', p_user_id;
  end if;
end;
$$;

revoke all on function public.bootstrap_demo_platform_role(uuid, public.user_role) from public;
grant execute on function public.bootstrap_demo_platform_role(uuid, public.user_role) to service_role;
