-- Sendcloud consolidation cleanup (forward-only).
-- Renames legacy provider artifacts; does not drop shipping data columns.

-- Resolution engine automation logs
alter table public.automation_logs
  rename column parcel2go_response to sendcloud_response;

-- Shipping provider defaults
alter table public.shipping_records
  alter column provider set default 'sendcloud';

alter table public.shipping_labels_v1
  alter column provider set default 'sendcloud';

-- Obsolete dual-provider fallback log (Sendcloud-only architecture)
drop table if exists public.shipping_fallback_events;

-- Legacy Parcel2Go webhook inbox (no active integration)
drop table if exists public.parcel2go_webhook_events;

-- Resolution engine carrier claims default provider
alter table public.carrier_claims
  alter column provider set default 'sendcloud';
