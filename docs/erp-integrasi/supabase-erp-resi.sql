-- WOS: tabel penerimaan data resi dari ERP Tigalapan (Supabase).
-- Jalankan SEKALI di Supabase > SQL Editor. Aman dijalankan berulang.
-- Data ini TERPISAH dari spreadsheet manual WOS: tidak menyentuh Google Sheets sama sekali.

create table if not exists public.erp_resi (
  resi_group_id text primary key,              -- id resi di ERP (kunci unik, juga kunci idempotensi)
  resi_no text not null,                       -- nomor resi / AWB dari ekspedisi
  expedition text,
  note text,
  shipping_date date,
  vendor_id text,
  vendor_name text,
  mrp_numbers text[] not null default '{}',
  total_koli integer not null default 0,
  total_qty integer not null default 0,
  attachments jsonb not null default '[]',     -- [{index, fileName, path, contentType, size}] file ada di Storage bucket erp-resi-files
  wos_status text not null default 'BARU',     -- untuk dipakai alur WOS (mis. BARU, DITERIMA)
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  raw jsonb not null                           -- isi kiriman ERP apa adanya
);

create table if not exists public.erp_resi_koli (
  id text primary key,                         -- resi_group_id|koliId
  resi_group_id text not null references public.erp_resi(resi_group_id) on delete cascade,
  koli_id text not null,
  koli_no text,
  mrp_no text,
  weight_kg numeric
);

create table if not exists public.erp_resi_item (
  id bigint generated always as identity primary key,
  koli_pk text not null references public.erp_resi_koli(id) on delete cascade,
  resi_group_id text not null,
  color text,
  sleeve text,
  size text,
  sku text,
  qty integer not null,
  kind text,                                   -- FG | REWORK
  age text
);

create index if not exists erp_resi_shipping_idx on public.erp_resi(shipping_date desc);
create index if not exists erp_resi_koli_resi_idx on public.erp_resi_koli(resi_group_id);
create index if not exists erp_resi_item_koli_idx on public.erp_resi_item(koli_pk);

-- Hanya fungsi server (kunci service role) yang boleh menyentuh tabel ini; tidak ada akses dari browser.
alter table public.erp_resi enable row level security;
alter table public.erp_resi_koli enable row level security;
alter table public.erp_resi_item enable row level security;

-- Simpan satu kiriman ERP sekaligus dalam satu transaksi (idempoten: kiriman ulang menggantikan koli dan item resi yang sama,
-- tanpa menimpa status WOS dan lampiran yang sudah tersimpan).
create or replace function public.erp_receive_resi(p jsonb) returns void
language plpgsql
as $$
declare
  rid text := p->'resi'->>'resiGroupId';
  k jsonb;
  i jsonb;
  kpk text;
begin
  if rid is null or rid = '' then
    raise exception 'resiGroupId kosong';
  end if;

  insert into public.erp_resi (resi_group_id, resi_no, expedition, note, shipping_date, vendor_id, vendor_name, mrp_numbers, total_koli, total_qty, raw)
  values (
    rid,
    coalesce(p->'resi'->>'resiNo', rid),
    p->'resi'->>'expedition',
    p->'resi'->>'note',
    nullif(p->'resi'->>'shippingDate', '')::date,
    p->'resi'->'vendor'->>'id',
    p->'resi'->'vendor'->>'name',
    coalesce(array(select jsonb_array_elements_text(p->'resi'->'mrpNumbers')), '{}'),
    coalesce((p->'resi'->>'totalKoli')::int, 0),
    coalesce((p->'resi'->>'totalQty')::int, 0),
    p
  )
  on conflict (resi_group_id) do update set
    resi_no = excluded.resi_no,
    expedition = excluded.expedition,
    note = excluded.note,
    shipping_date = excluded.shipping_date,
    vendor_id = excluded.vendor_id,
    vendor_name = excluded.vendor_name,
    mrp_numbers = excluded.mrp_numbers,
    total_koli = excluded.total_koli,
    total_qty = excluded.total_qty,
    raw = excluded.raw,
    updated_at = now();

  delete from public.erp_resi_koli where resi_group_id = rid;   -- item ikut terhapus (cascade), lalu diisi ulang di bawah

  for k in select * from jsonb_array_elements(coalesce(p->'kolis', '[]'::jsonb)) loop
    kpk := rid || '|' || (k->>'koliId');
    insert into public.erp_resi_koli (id, resi_group_id, koli_id, koli_no, mrp_no, weight_kg)
    values (kpk, rid, k->>'koliId', k->>'koliNo', k->>'mrpNo', nullif(k->>'weightKg', '')::numeric);
    for i in select * from jsonb_array_elements(coalesce(k->'items', '[]'::jsonb)) loop
      insert into public.erp_resi_item (koli_pk, resi_group_id, color, sleeve, size, sku, qty, kind, age)
      values (kpk, rid, i->>'color', i->>'sleeve', i->>'size', i->>'sku', coalesce((i->>'qty')::int, 0), i->>'kind', i->>'age');
    end loop;
  end loop;
end;
$$;

revoke all on function public.erp_receive_resi(jsonb) from public, anon, authenticated;

-- Tempat file lampiran resi (privat). Dibuka lewat tautan sementara dari fungsi baca.
insert into storage.buckets (id, name, public) values ('erp-resi-files', 'erp-resi-files', false)
on conflict (id) do nothing;

-- Tampilan siap pakai untuk tab Inbound > Incoming di WOS: satu baris = satu MRP (kolom PO) dalam satu resi (kolom STTB).
-- po = nomor MRP, sttb = nomor resi, total_koli/koli_list/total_qty dihitung hanya dari koli milik MRP itu di resi tersebut
-- (satu resi yang memuat dua MRP menjadi dua baris). Tidak bisa dibaca dari browser (security_invoker + RLS tanpa policy).
create or replace view public.erp_incoming with (security_invoker = true) as
select
  k.mrp_no as po,
  r.vendor_name as vendor,
  r.resi_no as sttb,
  r.expedition as ekspedisi,
  r.shipping_date,
  count(*)::int as total_koli,
  array_agg(k.koli_no order by k.koli_no) as koli_list,
  coalesce(sum(q.qty), 0)::int as total_qty,
  r.resi_group_id
from public.erp_resi_koli k
join public.erp_resi r on r.resi_group_id = k.resi_group_id
left join lateral (select sum(i.qty) as qty from public.erp_resi_item i where i.koli_pk = k.id) q on true
group by k.mrp_no, r.vendor_name, r.resi_no, r.expedition, r.shipping_date, r.resi_group_id;
