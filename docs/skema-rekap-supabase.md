# Skema database rekap W.O.S (rencana Supabase)

Tujuan: rekap per operator yang bisa ditarik **harian, mingguan, bulanan, atau rentang tanggal bebas**.
Saat ini aplikasi menyimpan data hanya di browser (localStorage), sehingga rekap hanya mencakup tanggal yang sudah terbaca di browser itu.
Skema di bawah menggantikannya dengan satu sumber data bersama.

## Aturan peran (sudah dipakai di aplikasi)
- **Picker**: kode `W..` pada kolom Picker di SOQ.
- **Checker**: orang pertama di tim hari itu. Koli masuk ke tugas Checker **saat picking selesai**.
- **Packer**: orang kedua di tim hari itu. Koli masuk ke tugas Packer **saat VP selesai** (packing dan staging otomatis).
- **Driver**: 1–2 orang per hari; mencentang Loading dan Unloading.
- **Admin**: *Order processing* = SOQ yang diposting hari itu; *Transfer stok* = koli dengan TFS selesai.
- Tim bisa diisi siapa saja dari operator/driver (tanpa Admin dan Supervisor), satu orang hanya satu posisi per hari.

## Tabel

```sql
create table staff (
  code text primary key,                      -- W03, W29, ...
  name text not null,
  role text not null check (role in ('Operator','Driver','Admin','Supervisor'))
);

-- Satu baris = satu baris SKU di tab outlet pada spreadsheet SOQ
create table soq_rows (
  id bigint generated always as identity primary key,
  soq_date date not null,
  outlet text not null,                       -- UPG-01, LLO-01, ...
  sheet_row int not null,
  batch_order text,
  koli int,
  sku text,
  soq int,
  act int,
  soo int,
  vp boolean not null default false,
  tfs boolean not null default false,
  picker text references staff(code),
  vp_wrong boolean not null default false,    -- sel VP berwarna merah (salah picking)
  ket text,                                   -- keterangan checker
  read_at timestamptz not null default now(),
  unique (outlet, soq_date, sheet_row)
);

-- Satu baris = satu koli (karung) pada satu outlet dan tanggal
create table koli (
  id text primary key,                        -- outlet|tanggal|batch|koli
  soq_date date not null,
  outlet text not null,
  batch_order text,
  koli_no int not null,
  pcs int
);

-- Tim yang bertugas pada koli itu
create table koli_team (
  koli_id text primary key references koli(id),
  checker text references staff(code),
  packer text references staff(code),
  drivers text[] not null default '{}',
  admin text references staff(code)
);

-- Riwayat tahap; bisa dibatalkan (dicatat sebagai baris baru, bukan dihapus)
create table koli_events (
  id bigint generated always as identity primary key,
  koli_id text not null references koli(id),
  stage text not null check (stage in ('picking','vp','packing_staging','tfs','sttb','loading','unloading')),
  undone boolean not null default false,
  actor text references staff(code),          -- yang mengerjakan (mis. driver bertugas)
  by_account text,                            -- yang menekan (driver / SPV / OWNER)
  at timestamptz not null default now()
);

create table sttb (
  no text primary key,                        -- STTB-YYYYMM-NNNN
  send_date date not null,
  printed_at timestamptz not null default now(),
  printed_by text,
  rows jsonb not null                         -- outlet, koli, tgl SOQ, id koli
);

create table sttb_counter (
  period text primary key,                    -- YYYYMM dari tanggal kirim
  last_no int not null default 0
);
```

## Penomoran STTB yang tidak bisa diubah
Format: **`STTB-YYYYMM-NNNN`** (bulan dari tanggal kirim, urutan berjalan per bulan, tidak pernah dipakai ulang).
Nomor dibuat di server, bukan di browser:

```sql
create function next_sttb_no(p_period text) returns text language plpgsql as $$
declare n int;
begin
  insert into sttb_counter(period,last_no) values (p_period,1)
  on conflict (period) do update set last_no = sttb_counter.last_no + 1
  returning last_no into n;
  return 'STTB-' || p_period || '-' || lpad(n::text,4,'0');
end $$;
-- Pasang juga: revoke update, delete on sttb from anon, authenticated;  (nomor tidak bisa diubah/dihapus)
```

## Rekap harian per operator
```sql
create view operator_daily as
  -- Picker
  select soq_date as day, picker as code, 'Picker' as role,
         count(distinct (outlet, koli)) as koli, count(*) as sku, sum(soq) as pcs
  from soq_rows where picker is not null and koli is not null group by 1,2
  union all
  -- Checker (koli yang picking-nya selesai)
  select k.soq_date, t.checker, 'Checker', count(*), 0, sum(k.pcs)
  from koli k join koli_team t on t.koli_id = k.id
  where t.checker is not null
    and exists (select 1 from koli_events e where e.koli_id=k.id and e.stage='picking' and not e.undone)
  group by 1,2
  union all
  -- Packer (koli yang VP-nya selesai)
  select k.soq_date, t.packer, 'Packer', count(*), 0, sum(k.pcs)
  from koli k join koli_team t on t.koli_id = k.id
  where t.packer is not null
    and exists (select 1 from koli_events e where e.koli_id=k.id and e.stage='vp' and not e.undone)
  group by 1,2
  union all
  -- Driver
  select k.soq_date, d, 'Driver', count(*), 0, sum(k.pcs)
  from koli k join koli_team t on t.koli_id = k.id, unnest(t.drivers) d group by 1,2
  union all
  -- Admin: order processing (SOQ yang diposting)
  select r.soq_date, (select admin from koli_team t join koli k on k.id=t.koli_id where k.soq_date=r.soq_date limit 1),
         'Admin · Order processing', count(distinct (r.outlet, r.koli)), count(*), sum(r.soq)
  from soq_rows r group by r.soq_date
  union all
  -- Admin: transfer stok (koli dengan TFS)
  select k.soq_date, t.admin, 'Admin · Transfer stok', count(*), 0, sum(k.pcs)
  from koli k join koli_team t on t.koli_id=k.id
  where exists (select 1 from koli_events e where e.koli_id=k.id and e.stage='tfs' and not e.undone)
  group by 1,2;
```

## Menarik data: harian, mingguan, bulanan, atau rentang tanggal
Rentang tanggal bebas (tanggal mulai dan tanggal akhir):
```sql
select code, role, count(distinct day) as hari_aktif,
       sum(koli) as koli, sum(sku) as sku, sum(pcs) as pcs
from operator_daily
where day between :mulai and :akhir
group by code, role
order by role, code;
```
Per hari / minggu / bulan (pilih satu baris `date_trunc`):
```sql
select date_trunc('day',   day) as periode, code, role, sum(koli) koli, sum(pcs) pcs from operator_daily
where day between :mulai and :akhir group by 1,2,3 order by 1,3,2;
-- ganti 'day' dengan 'week' atau 'month' untuk rekap mingguan / bulanan
```
Rekap tahunan memakai `date_trunc('year', day)` atau rentang 1 Januari–31 Desember.

## Hak akses (Row Level Security)
- Semua staf masuk dengan akun sendiri (Supabase Auth); kode staf terhubung ke akun.
- **Driver yang ditugaskan, Supervisor, dan Owner**: boleh menambah `koli_events` bertahap `loading` dan `unloading` (termasuk membatalkan).
- **Supervisor dan Owner**: boleh mengubah `koli_team` (tim hari itu).
- **Admin**: boleh membuat `sttb`; tidak ada yang boleh mengubah atau menghapus `sttb`.
- Rekap (`operator_daily`) dapat dibaca Supervisor dan Owner; operator hanya melihat barisnya sendiri.
