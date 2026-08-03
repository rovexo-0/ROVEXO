-- ROVEXO Realtime Certification v1.0
-- Enable filtered postgres_changes on non-PK columns (buyer_id / seller_id / user_id).
-- Without REPLICA IDENTITY FULL, UPDATE events filtered by those columns never reach clients.

alter table public.conversations replica identity full;
alter table public.orders replica identity full;
alter table public.notifications replica identity full;
alter table public.wallets replica identity full;
alter table public.wallet_transactions replica identity full;
alter table public.products replica identity full;

do $$
begin
  if to_regclass('public.user_follows') is not null then
    execute 'alter table public.user_follows replica identity full';
  end if;
  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews replica identity full';
  end if;
end $$;
