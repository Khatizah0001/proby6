-- ProBy6 — Skema PostgreSQL (Supabase). Jalankan sebelum 0002_rls.sql
create extension if not exists pgcrypto;

create type user_role     as enum ('ADMIN','PK1','GURU_KELAS','FEEDER','PPD');
create type status_profil as enum ('BELUM_MULA','DALAM_PROSES','PERLU_SEMAKAN','LENGKAP','DISAHKAN','DIKONGSI','DICETAK');
create type audit_action  as enum ('LOGIN','LOGOUT','VIEW','PRINT','SHARE','UNSHARE','PRESENT','CREATE','UPDATE','DELETE');

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Utiliti masking (IC & telefon TIDAK disimpan penuh — hanya versi masked)
create or replace function public.mask_ic(ic text) returns text language sql immutable as $$
  select case when length(regexp_replace(coalesce(ic,''),'\D','','g')) >= 12
    then substr(regexp_replace(ic,'\D','','g'),1,6) || '-**-***' || right(regexp_replace(ic,'\D','','g'),1)
    else '******-**-****' end $$;
create or replace function public.mask_phone(t text) returns text language sql immutable as $$
  select case when length(regexp_replace(coalesce(t,''),'\D','','g')) >= 7
    then substr(regexp_replace(t,'\D','','g'),1,3) || '-***' || right(regexp_replace(t,'\D','','g'),4)
    else '***-*******' end $$;

-- Jadual tambahan (diperlukan untuk FK feeder): sekolah feeder
create table public.feeder_school (
  id uuid primary key default gen_random_uuid(),
  kod text unique not null,
  nama text not null,
  sekolah_menengah text,
  created_at timestamptz not null default now()
);

-- 1. users (profil aplikasi; id sama dengan auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  email text unique not null,
  role user_role not null,
  sekolah text,
  feeder_id uuid references public.feeder_school(id) on delete set null,
  status text not null default 'AKTIF' check (status in ('AKTIF','TIDAK_AKTIF')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feeder_requires_school check (role <> 'FEEDER' or feeder_id is not null)
);

-- 2. murid
create table public.murid (
  id uuid primary key default gen_random_uuid(),
  nama_murid text not null,
  no_kp_masked text not null,
  jantina char(1) not null check (jantina in ('L','P')),
  tarikh_lahir date,
  tahun smallint not null default 6,
  kelas text not null,
  guru_kelas_id uuid references public.users(id) on delete set null,
  sekolah_rendah text not null default 'SK Nanga Luau',
  feeder_id uuid references public.feeder_school(id) on delete set null,
  status_asrama text check (status_asrama in ('ASRAMA','BUKAN_ASRAMA')),
  alamat text,
  penjaga text,
  no_telefon_masked text,
  bantuan text,
  masalah_kesihatan text,
  photo_url text,
  status_profil status_profil not null default 'BELUM_MULA',
  disahkan_oleh uuid references public.users(id),
  tarikh_sah timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.murid (guru_kelas_id);
create index on public.murid (feeder_id);
create index on public.murid (kelas);
create index on public.murid (disahkan_oleh);
create index on public.users (feeder_id);

-- 3. akademik (purata & tafsiran dikira oleh DB)
create table public.akademik (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  tahun smallint not null default 2026,
  pentaksiran text default 'PBD Semester 2',
  bm numeric(5,2) check (bm between 0 and 100), bi numeric(5,2) check (bi between 0 and 100),
  matematik numeric(5,2) check (matematik between 0 and 100), sains numeric(5,2) check (sains between 0 and 100),
  sejarah numeric(5,2) check (sejarah between 0 and 100), pendidikan_islam_moral numeric(5,2) check (pendidikan_islam_moral between 0 and 100),
  pjpk numeric(5,2) check (pjpk between 0 and 100), muzik numeric(5,2) check (muzik between 0 and 100),
  psv numeric(5,2) check (psv between 0 and 100), rbt numeric(5,2) check (rbt between 0 and 100),
  purata numeric(5,2) generated always as (
    round((coalesce(bm,0)+coalesce(bi,0)+coalesce(matematik,0)+coalesce(sains,0)+coalesce(sejarah,0)+coalesce(pendidikan_islam_moral,0)+coalesce(pjpk,0)+coalesce(muzik,0)+coalesce(psv,0)+coalesce(rbt,0))
    / nullif((bm is not null)::int+(bi is not null)::int+(matematik is not null)::int+(sains is not null)::int+(sejarah is not null)::int+(pendidikan_islam_moral is not null)::int+(pjpk is not null)::int+(muzik is not null)::int+(psv is not null)::int+(rbt is not null)::int,0),2)) stored,
  tafsiran text generated always as (case when ((coalesce(bm,0)+coalesce(bi,0)+coalesce(matematik,0)+coalesce(sains,0)+coalesce(sejarah,0)+coalesce(pendidikan_islam_moral,0)+coalesce(pjpk,0)+coalesce(muzik,0)+coalesce(psv,0)+coalesce(rbt,0))/nullif((bm is not null)::int+(bi is not null)::int+(matematik is not null)::int+(sains is not null)::int+(sejarah is not null)::int+(pendidikan_islam_moral is not null)::int+(pjpk is not null)::int+(muzik is not null)::int+(psv is not null)::int+(rbt is not null)::int,0)) is null then null when ((coalesce(bm,0)+coalesce(bi,0)+coalesce(matematik,0)+coalesce(sains,0)+coalesce(sejarah,0)+coalesce(pendidikan_islam_moral,0)+coalesce(pjpk,0)+coalesce(muzik,0)+coalesce(psv,0)+coalesce(rbt,0))/nullif((bm is not null)::int+(bi is not null)::int+(matematik is not null)::int+(sains is not null)::int+(sejarah is not null)::int+(pendidikan_islam_moral is not null)::int+(pjpk is not null)::int+(muzik is not null)::int+(psv is not null)::int+(rbt is not null)::int,0))>=80 then 'CEMERLANG' when ((coalesce(bm,0)+coalesce(bi,0)+coalesce(matematik,0)+coalesce(sains,0)+coalesce(sejarah,0)+coalesce(pendidikan_islam_moral,0)+coalesce(pjpk,0)+coalesce(muzik,0)+coalesce(psv,0)+coalesce(rbt,0))/nullif((bm is not null)::int+(bi is not null)::int+(matematik is not null)::int+(sains is not null)::int+(sejarah is not null)::int+(pendidikan_islam_moral is not null)::int+(pjpk is not null)::int+(muzik is not null)::int+(psv is not null)::int+(rbt is not null)::int,0))>=60 then 'BAIK' when ((coalesce(bm,0)+coalesce(bi,0)+coalesce(matematik,0)+coalesce(sains,0)+coalesce(sejarah,0)+coalesce(pendidikan_islam_moral,0)+coalesce(pjpk,0)+coalesce(muzik,0)+coalesce(psv,0)+coalesce(rbt,0))/nullif((bm is not null)::int+(bi is not null)::int+(matematik is not null)::int+(sains is not null)::int+(sejarah is not null)::int+(pendidikan_islam_moral is not null)::int+(pjpk is not null)::int+(muzik is not null)::int+(psv is not null)::int+(rbt is not null)::int,0))>=40 then 'MEMUASKAN' else 'PERLU_BANTUAN' end) stored, -- lajur terbitan tidak boleh rujuk lajur terbitan lain
  updated_at timestamptz not null default now()
);

-- 4. updlp6
create table public.updlp6 (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  english numeric(5,2) check (english between 0 and 100), science numeric(5,2) check (science between 0 and 100), mathematics numeric(5,2) check (mathematics between 0 and 100),
  purata numeric(5,2) generated always as (round((coalesce(english,0)+coalesce(science,0)+coalesce(mathematics,0))/nullif((english is not null)::int+(science is not null)::int+(mathematics is not null)::int,0),2)) stored,
  risiko text generated always as (case when english is null and science is null and mathematics is null then null
    when (coalesce(english,0)+coalesce(science,0)+coalesce(mathematics,0))/nullif((english is not null)::int+(science is not null)::int+(mathematics is not null)::int,0) < 40 then 'TINGGI'
    when (coalesce(english,0)+coalesce(science,0)+coalesce(mathematics,0))/nullif((english is not null)::int+(science is not null)::int+(mathematics is not null)::int,0) < 60 then 'SEDERHANA' else 'RENDAH' end) stored,
  updated_at timestamptz not null default now()
);

-- 5. tiga_m (teks + CHECK supaya boleh digunakan dalam generated column)
create table public.tiga_m (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  membaca_bm text check (membaca_bm in ('MAHIR','SEDERHANA','LEMAH')), menulis_bm text check (menulis_bm in ('MAHIR','SEDERHANA','LEMAH')),
  reading_bi text check (reading_bi in ('MAHIR','SEDERHANA','LEMAH')), writing_bi text check (writing_bi in ('MAHIR','SEDERHANA','LEMAH')),
  mengira text check (mengira in ('MAHIR','SEDERHANA','LEMAH')),
  status_keseluruhan text generated always as (case
    when 'LEMAH' in (membaca_bm,menulis_bm,reading_bi,writing_bi,mengira) then 'PERLU_INTERVENSI'
    when membaca_bm='MAHIR' and menulis_bm='MAHIR' and reading_bi='MAHIR' and writing_bi='MAHIR' and mengira='MAHIR' then 'CEMERLANG'
    else 'SEDERHANA' end) stored,
  catatan text,
  updated_at timestamptz not null default now()
);

-- 6. psikometrik (Kecerdasan Pelbagai, skala 0-100)
create table public.psikometrik (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  verbal_linguistik smallint check (verbal_linguistik between 0 and 100), visual_ruang smallint check (visual_ruang between 0 and 100),
  logik_matematik smallint check (logik_matematik between 0 and 100), muzik smallint check (muzik between 0 and 100),
  naturalis smallint check (naturalis between 0 and 100), kinestatik smallint check (kinestatik between 0 and 100),
  interpersonal smallint check (interpersonal between 0 and 100), intrapersonal smallint check (intrapersonal between 0 and 100),
  existential smallint check (existential between 0 and 100),
  dominan text, -- dikira oleh aplikasi (lib/insight.ts)
  updated_at timestamptz not null default now()
);

-- 7. kokurikulum
create table public.kokurikulum (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  unit_beruniform text, jawatan_unit text, kelab_persatuan text, jawatan_kelab text, sukan_permainan text, jawatan_sukan text,
  pencapaian text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 8. kesihatan (BMI dikira DB)
create table public.kesihatan (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  tinggi_cm numeric(5,1) check (tinggi_cm between 80 and 220), berat_kg numeric(5,1) check (berat_kg between 10 and 200),
  bmi numeric(4,1) generated always as (round(berat_kg / ((tinggi_cm/100.0)*(tinggi_cm/100.0)),1)) stored,
  status_bmi text generated always as (case when tinggi_cm is null or berat_kg is null then null
    when berat_kg/((tinggi_cm/100.0)*(tinggi_cm/100.0)) < 14.5 then 'KURANG' when berat_kg/((tinggi_cm/100.0)*(tinggi_cm/100.0)) < 20 then 'NORMAL'
    when berat_kg/((tinggi_cm/100.0)*(tinggi_cm/100.0)) < 23 then 'LEBIH' else 'OBES' end) stored,
  kecacatan text default 'Tiada', pendengaran text default 'Normal', penglihatan text default 'Normal', pertuturan text default 'Normal',
  catatan text,
  updated_at timestamptz not null default now()
);

-- 9. kehadiran
create table public.kehadiran (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  jumlah_hari int not null check (jumlah_hari > 0), hadir int not null check (hadir >= 0),
  tidak_hadir int generated always as (jumlah_hari - hadir) stored,
  peratus numeric(5,1) generated always as (round(hadir*100.0/jumlah_hari,1)) stored,
  tafsiran text generated always as (case when hadir*100.0/jumlah_hari >= 95 then 'CEMERLANG' when hadir*100.0/jumlah_hari >= 85 then 'BAIK' else 'BERISIKO' end) stored,
  updated_at timestamptz not null default now(),
  constraint hadir_lte_jumlah check (hadir <= jumlah_hari)
);

-- 10. ssdm
create table public.ssdm (
  id uuid primary key default gen_random_uuid(),
  murid_id uuid not null unique references public.murid(id) on delete cascade,
  amalan_baik text, kes_disiplin int not null default 0 check (kes_disiplin >= 0), catatan text,
  risiko text generated always as (case when kes_disiplin >= 3 then 'TINGGI' when kes_disiplin > 0 then 'SEDERHANA' else 'RENDAH' end) stored,
  updated_at timestamptz not null default now()
);

-- 11. feeder_access: satu baris per (feeder, murid) supaya FK ke murid sah. Sentiasa READ_ONLY.
create table public.feeder_access (
  id uuid primary key default gen_random_uuid(),
  feeder_id uuid not null references public.feeder_school(id) on delete cascade,
  murid_id uuid not null references public.murid(id) on delete cascade,
  access_level text not null default 'READ_ONLY' check (access_level = 'READ_ONLY'),
  can_print boolean not null default false,
  status text not null default 'AKTIF' check (status in ('AKTIF','TIDAK_AKTIF')),
  shared_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (feeder_id, murid_id)
);
create index on public.feeder_access (feeder_id) where status = 'AKTIF';
create index on public.feeder_access (murid_id);
create index on public.feeder_access (shared_by);

-- 12. audit_log (append-only; lihat RLS)
create table public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid references public.users(id) on delete set null,
  role user_role,
  action audit_action not null,
  murid_id uuid references public.murid(id) on delete set null,
  details jsonb not null default '{}'::jsonb
);
create index on public.audit_log (created_at desc);
create index on public.audit_log (murid_id);
create index on public.audit_log (user_id);

-- Trigger updated_at
do $$ declare t text; begin
  foreach t in array array['users','murid','akademik','updlp6','tiga_m','psikometrik','kokurikulum','kesihatan','kehadiran','ssdm','feeder_access'] loop
    execute format('create trigger trg_%1$s_upd before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop; end $$;
