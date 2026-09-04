-- ROVEXO Business Wallet separation — withdraw_methods seller_context
-- One ROVEXO user. Individual and Business payout methods must not share a row.
-- Does not create a second wallet engine or ledger table.
-- Existing rows default to individual (Personal Wallet).

alter table public.withdraw_methods
  add column if not exists seller_context text;

update public.withdraw_methods
set seller_context = 'individual'
where seller_context is null;

alter table public.withdraw_methods
  alter column seller_context set default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'withdraw_methods_seller_context_check'
  ) then
    alter table public.withdraw_methods
      add constraint withdraw_methods_seller_context_check
      check (seller_context in ('individual', 'business'));
  end if;
end $$;

alter table public.withdraw_methods
  alter column seller_context set not null;

drop index if exists public.withdraw_methods_user_bank_account_uidx;

create unique index if not exists withdraw_methods_user_bank_account_context_uidx
  on public.withdraw_methods (user_id, seller_context)
  where provider = 'bank_account';

create unique index if not exists withdraw_methods_user_stripe_connect_context_uidx
  on public.withdraw_methods (user_id, seller_context)
  where provider = 'stripe_connect';

comment on column public.withdraw_methods.seller_context is
  'Financial context: individual (Personal Wallet) or business (Business Wallet). Never mix.';

comment on index public.withdraw_methods_user_bank_account_context_uidx is
  'One native ROVEXO bank account per user per seller_context.';
