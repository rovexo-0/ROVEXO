-- Pre-launch security hardening (idempotent)

-- ---------------------------------------------------------------------------
-- Prevent non-admin users from self-verifying
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_verified_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified is distinct from old.verified then
    if not public.is_admin() then
      raise exception 'Verification changes require admin privileges';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_verified_escalation on public.profiles;
create trigger profiles_prevent_verified_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_verified_escalation();

-- ---------------------------------------------------------------------------
-- Restrict profile email exposure to service role (column-level grants)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;

grant select (
  id,
  username,
  full_name,
  avatar_url,
  verified,
  role,
  created_at,
  updated_at
) on table public.profiles to anon, authenticated;

grant update (username, full_name, avatar_url)
  on table public.profiles to authenticated;
