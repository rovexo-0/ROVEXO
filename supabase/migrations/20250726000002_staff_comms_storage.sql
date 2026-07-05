-- Staff comms storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-comms',
  'staff-comms',
  false,
  26214400,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/webm',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do nothing;

do $do$ begin
  create policy "Staff comms upload authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'staff-comms');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create policy "Staff comms read authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'staff-comms');
exception when duplicate_object then null;
end $do$;
