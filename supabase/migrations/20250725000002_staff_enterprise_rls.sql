-- Staff enterprise RLS — allow active staff to read own profile for portal/middleware gates.

drop policy if exists "staff_profiles_self_read" on public.staff_profiles;
create policy "staff_profiles_self_read"
  on public.staff_profiles for select
  using (profile_id = auth.uid() and status = 'active');

drop policy if exists "staff_member_roles_self_read" on public.staff_member_roles;
create policy "staff_member_roles_self_read"
  on public.staff_member_roles for select
  using (exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_member_roles.staff_id
      and sp.profile_id = auth.uid()
      and sp.status = 'active'
  ));
