-- ROVEXO Bank Account + buyer refund wallet-credit (additive)
-- One personal bank_account row per user. RLS owner isolation unchanged.
-- Does not disable RLS. Does not create a second wallet or ledger.

delete from public.withdraw_methods a
using public.withdraw_methods b
where a.provider = 'bank_account'
  and b.provider = 'bank_account'
  and a.user_id = b.user_id
  and a.ctid < b.ctid;

create unique index if not exists withdraw_methods_user_bank_account_uidx
  on public.withdraw_methods (user_id)
  where provider = 'bank_account';

-- Confirm owner-only DML remains (narrow re-assert; never DROP ALL).
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

-- Ciphertext columns remain service-role only (no authenticated SELECT).
revoke select (sort_code, account_number) on table public.withdraw_methods from authenticated, anon;
grant select (sort_code, account_number) on table public.withdraw_methods to service_role;
grant update (sort_code, account_number) on table public.withdraw_methods to service_role;
grant insert (sort_code, account_number) on table public.withdraw_methods to service_role;

comment on index public.withdraw_methods_user_bank_account_uidx is
  'One native ROVEXO bank account per user. Update-in-place; no parallel bank table.';
