-- Dijalankan pada projek ProBy6 (Supabase). Pindahkan fungsi pembantu RLS ke skema 'private'
-- supaya tidak boleh dipanggil melalui API /rest/v1/rpc (lulus semakan Security Advisor).
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.auth_role() set schema private;
alter function public.auth_feeder_id() set schema private;
alter function public.can_read_murid(uuid) set schema private;
alter function public.can_write_murid(uuid) set schema private;
alter function public.can_print_murid(uuid) set schema private;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
-- Nota: 0002_rls.sql dalam repo ini masih merujuk public.*; jalankan berurutan 0001 -> 0002 -> 0003 pada projek baharu.
