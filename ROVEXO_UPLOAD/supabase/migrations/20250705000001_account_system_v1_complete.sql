-- ROVEXO Account System v1.0 completion (idempotent)

alter table public.buyer_preferences
  add column if not exists region text not null default 'Ireland',
  add column if not exists preferred_category_slugs text[] not null default '{}'::text[];

alter table public.seller_shipping_settings
  add column if not exists base_shipping_cost numeric(12, 2) not null default 0,
  add column if not exists dispatch_time_days integer not null default 1;

do $do$ begin
  alter table public.seller_shipping_settings
    add constraint seller_shipping_dispatch_time_check
    check (dispatch_time_days >= 0 and dispatch_time_days <= 30);
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter table public.seller_shipping_settings
    add constraint seller_shipping_base_cost_check
    check (base_shipping_cost >= 0 and base_shipping_cost <= 99999);
exception when duplicate_object then null;
end $do$;

alter table public.notification_settings
  add column if not exists promotions boolean not null default true,
  add column if not exists marketing boolean not null default false,
  add column if not exists email_messages boolean not null default true,
  add column if not exists email_orders boolean not null default true,
  add column if not exists email_promotions boolean not null default false,
  add column if not exists email_marketing boolean not null default false;
