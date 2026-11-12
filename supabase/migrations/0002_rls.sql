-- ProBy6 — Row Level Security. Jalankan selepas 0001_schema.sql
-- Nota: service_role key memintas RLS — jangan dedahkan ke pelayar (NEXT_PUBLIC_*).

-- Fungsi pembantu berada dalam skema 'private' (tidak didedahkan melalui API RPC)
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------- Fungsi pembantu (SECURITY DEFINER supaya tidak rekursif) ----------
create or replace function private.auth_role() returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid() and status = 'AKTIF' $$;
create or replace function private.auth_feeder_id() returns uuid language sql stable security definer set search_path = public as $$
  select feeder_id from public.users where id = auth.uid() and status = 'AKTIF' $$;

create or replace function private.can_read_murid(m uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.murid x where x.id = m and (
    private.auth_role() in ('ADMIN','PK1','PPD')
    or (private.auth_role() = 'GURU_KELAS' and x.guru_kelas_id = auth.uid())
    or (private.auth_role() = 'FEEDER' and exists (
          select 1 from public.feeder_access fa
          where fa.murid_id = x.id and fa.feeder_id = private.auth_feeder_id() and fa.status = 'AKTIF'))
  )) $$;

create or replace function private.can_write_murid(m uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.murid x where x.id = m and (
    private.auth_role() in ('ADMIN','PK1')
    or (private.auth_role() = 'GURU_KELAS' and x.guru_kelas_id = auth.uid())
  )) $$;

create or replace function private.can_print_murid(m uuid) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when private.auth_role() in ('ADMIN','PK1') then true
    when private.auth_role() = 'GURU_KELAS' then exists (select 1 from public.murid x where x.id = m and x.guru_kelas_id = auth.uid())
    when private.auth_role() = 'FEEDER' then exists (select 1 from public.feeder_access fa where fa.murid_id = m and fa.feeder_id = private.auth_feeder_id() and fa.status = 'AKTIF' and fa.can_print)
    else false end $$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ---------- Dayakan RLS ----------
alter table public.users enable row level security;           alter table public.feeder_school enable row level security;
alter table public.murid enable row level security;           alter table public.feeder_access enable row level security;
alter table public.audit_log enable row level security;
alter table public.akademik enable row level security;        alter table public.updlp6 enable row level security;
alter table public.tiga_m enable row level security;          alter table public.psikometrik enable row level security;
alter table public.kokurikulum enable row level security;     alter table public.kesihatan enable row level security;
alter table public.kehadiran enable row level security;       alter table public.ssdm enable row level security;

-- ---------- users ----------
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or private.auth_role() in ('ADMIN','PK1'));
create policy users_admin_write on public.users for all to authenticated
  using (private.auth_role() = 'ADMIN') with check (private.auth_role() = 'ADMIN');

-- ---------- feeder_school ----------
create policy feeder_school_select on public.feeder_school for select to authenticated using (true);
create policy feeder_school_write on public.feeder_school for all to authenticated
  using (private.auth_role() = 'ADMIN') with check (private.auth_role() = 'ADMIN');

-- ---------- murid ----------
-- Feeder: SELECT sahaja, hanya murid yang dikongsi kepada feeder_id mereka.
-- Guru Kelas: baca & ubah murid kelas sendiri sahaja.
create policy murid_select on public.murid for select to authenticated using (private.can_read_murid(id));
create policy murid_insert on public.murid for insert to authenticated
  with check (private.auth_role() in ('ADMIN','PK1') or (private.auth_role() = 'GURU_KELAS' and guru_kelas_id = auth.uid()));
create policy murid_update on public.murid for update to authenticated
  using (private.can_write_murid(id))
  with check (private.auth_role() in ('ADMIN','PK1') or (private.auth_role() = 'GURU_KELAS' and guru_kelas_id = auth.uid()));
create policy murid_delete on public.murid for delete to authenticated using (private.auth_role() = 'ADMIN');

-- Guru Kelas tidak boleh menugaskan semula murid atau mengesahkan/mengubah status kongsi
create or replace function public.guard_murid_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if private.auth_role() = 'GURU_KELAS' then
    if new.guru_kelas_id is distinct from old.guru_kelas_id or new.disahkan_oleh is distinct from old.disahkan_oleh
       or (new.status_profil in ('DISAHKAN','DIKONGSI','DICETAK') and new.status_profil is distinct from old.status_profil) then
      raise exception 'Tindakan ini memerlukan PK1/Admin';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.guard_murid_update() from public, anon, authenticated;
create trigger trg_murid_guard before update on public.murid for each row execute function public.guard_murid_update();

-- ---------- Jadual anak: baca ikut can_read, tulis ikut can_write ----------
do $$ declare t text; begin
  foreach t in array array['akademik','updlp6','tiga_m','psikometrik','kokurikulum','kesihatan','kehadiran','ssdm'] loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (private.can_read_murid(murid_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (private.can_write_murid(murid_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (private.can_write_murid(murid_id)) with check (private.can_write_murid(murid_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (private.auth_role() = ''ADMIN'')', t);
  end loop; end $$;

-- ---------- feeder_access ----------
create policy fa_select on public.feeder_access for select to authenticated
  using (private.auth_role() in ('ADMIN','PK1','PPD') or (private.auth_role() = 'FEEDER' and feeder_id = private.auth_feeder_id()));
create policy fa_write on public.feeder_access for all to authenticated
  using (private.auth_role() in ('ADMIN','PK1')) with check (private.auth_role() in ('ADMIN','PK1'));

-- Log SHARE/UNSHARE automatik apabila akses diubah
create or replace function public.log_share() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(user_id, role, action, murid_id, details)
  values (auth.uid(), private.auth_role(), case when tg_op = 'DELETE' then 'UNSHARE'::audit_action else 'SHARE'::audit_action end,
          coalesce(new.murid_id, old.murid_id),
          jsonb_build_object('feeder_id', coalesce(new.feeder_id, old.feeder_id), 'can_print', coalesce(new.can_print, old.can_print), 'status', coalesce(new.status, old.status), 'op', tg_op));
  return coalesce(new, old);
end $$;
revoke execute on function public.log_share() from public, anon, authenticated;
create trigger trg_fa_audit after insert or update or delete on public.feeder_access for each row execute function public.log_share();

-- ---------- audit_log: append-only ----------
-- Pengguna hanya boleh menulis log atas nama sendiri; PRINT hanya jika dibenarkan; tiada policy UPDATE/DELETE.
create policy audit_insert on public.audit_log for insert to authenticated
  with check (user_id = auth.uid()
    and action in ('LOGIN','LOGOUT','VIEW','PRINT','PRESENT')
    and (murid_id is null or private.can_read_murid(murid_id))
    and (action <> 'PRINT' or private.can_print_murid(murid_id)));
create policy audit_select on public.audit_log for select to authenticated using (private.auth_role() in ('ADMIN','PK1'));

-- Baris public.users dicipta melalui skrip Admin/service role selepas jemput pengguna,
-- supaya peranan tidak boleh dipilih sendiri oleh pengguna.
