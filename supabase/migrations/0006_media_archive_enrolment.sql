-- Sudah diterapkan pada projek ProBy6 (Supabase). Simpan untuk projek pengeluaran (production) kelak.
alter table public.murid add column if not exists aktif boolean not null default true;
alter table public.murid add column if not exists tahun_akademik smallint not null default 2026;
create index if not exists murid_aktif_idx on public.murid (aktif);
alter table public.updlp6 add column if not exists slip_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('murid-foto', 'murid-foto', false, 2097152, array['image/jpeg','image/png','image/webp']),
  ('updlp6-slip', 'updlp6-slip', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types, public = false;

-- Laluan fail = {murid_id}/{nama fail}; kebenaran sama seperti RLS jadual murid.
create policy proby6_media_select on storage.objects for select to authenticated
  using (bucket_id in ('murid-foto','updlp6-slip') and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.can_read_murid(((storage.foldername(name))[1])::uuid) else false end);
create policy proby6_media_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('murid-foto','updlp6-slip') and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.can_write_murid(((storage.foldername(name))[1])::uuid) else false end);
create policy proby6_media_update on storage.objects for update to authenticated
  using (bucket_id in ('murid-foto','updlp6-slip') and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.can_write_murid(((storage.foldername(name))[1])::uuid) else false end)
  with check (bucket_id in ('murid-foto','updlp6-slip') and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.can_write_murid(((storage.foldername(name))[1])::uuid) else false end);
create policy proby6_media_delete on storage.objects for delete to authenticated
  using (bucket_id in ('murid-foto','updlp6-slip') and case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.can_write_murid(((storage.foldername(name))[1])::uuid) else false end);
