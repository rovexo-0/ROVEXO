-- Per-seller default label format (Sendcloud label_printer vs normal_printer).
alter table public.seller_shipping_settings
  add column if not exists default_label_size text not null default 'thermal_4x6';

alter table public.seller_shipping_settings
  drop constraint if exists seller_shipping_settings_default_label_size_check;

alter table public.seller_shipping_settings
  add constraint seller_shipping_settings_default_label_size_check
  check (default_label_size in ('thermal_4x6', 'a4_pdf'));
