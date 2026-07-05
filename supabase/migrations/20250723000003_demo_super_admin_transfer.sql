-- Demo UAT: allow transferring the single super_admin seat to the demo account.

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

  if p_target_role = 'super_admin' then
    update public.profiles
    set
      role = 'buyer'::public.user_role,
      updated_at = now()
    where role = 'super_admin'::public.user_role
      and id <> p_user_id;
  end if;

  update public.profiles
  set
    role = p_target_role,
    verified = true,
    account_status = 'active',
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Demo bootstrap user not found: %', p_user_id;
  end if;
end;
$$;

revoke all on function public.bootstrap_demo_platform_role(uuid, public.user_role) from public;
grant execute on function public.bootstrap_demo_platform_role(uuid, public.user_role) to service_role;
