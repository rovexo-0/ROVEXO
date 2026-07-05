-- Marketplace transaction mode — single canonical enum for category commerce behaviour.

do $$
begin
  create type public.transaction_mode as enum ('MARKETPLACE', 'DIRECT_CONTACT');
exception
  when duplicate_object then null;
end $$;

alter table public.categories
  add column if not exists transaction_mode public.transaction_mode not null default 'MARKETPLACE';

-- Classified / direct-contact root sectors (descendants inherit via sync + admin cascade).
with recursive direct_contact_roots as (
  select id
  from public.categories
  where parent_id is null
    and slug in ('vehicles', 'property', 'jobs', 'services')

  union all

  select c.id
  from public.categories c
  inner join direct_contact_roots d on c.parent_id = d.id
)
update public.categories
set transaction_mode = 'DIRECT_CONTACT'
where id in (select id from direct_contact_roots);

create index if not exists categories_transaction_mode_idx on public.categories (transaction_mode);
