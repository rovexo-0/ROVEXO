-- Sync profiles.verified when a user confirms their email.
-- Idempotent: safe to re-run when partially applied.

create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
    and (old.email_confirmed_at is null or old.email_confirmed_at is distinct from new.email_confirmed_at) then
    update public.profiles
    set verified = true,
        updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_email_confirmed();

-- Backfill verified status for users who already confirmed email.
update public.profiles p
set verified = true,
    updated_at = now()
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null
  and p.verified = false;
