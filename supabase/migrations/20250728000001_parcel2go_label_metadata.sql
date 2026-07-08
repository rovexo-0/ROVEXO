-- Parcel2Go label storage metadata (PHASE 2 completion).
-- Persist MIME type and byte size alongside the stored label so the Admin
-- Shipping Engine and dashboards can display durable label metadata.
-- Additive + idempotent.

alter table public.shipping_labels_v1
  add column if not exists label_mime_type text,
  add column if not exists label_size_bytes bigint;
