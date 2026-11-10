# Terima resi dari ERP Tigalapan di WOS

Fitur ini membuat WOS menerima data resi/pengiriman vendor **langsung dari ERP**, tanpa input manual. Datanya disimpan di
**Supabase** (terpisah dari spreadsheet manual: spreadsheet tidak disentuh sama sekali) dan bisa dilihat di halaman
`/erp-resi.html`.

## Cara kerja

1. Vendor menerbitkan resi di ERP (selesai "Set Ekspedisi & Resi").
2. ± 12 detik kemudian ERP mengirim `POST` berisi JSON ke `https://<alamat-wos>/api/erp-resi`.
3. WOS memeriksa tanda tangan, menyimpan resi + koli + item ke Supabase, mengunduh foto resi ke Supabase Storage, lalu membalas HTTP 200.
4. Kalau WOS mati atau membalas selain 200, ERP **mencoba ulang** otomatis. Penyimpanan bersifat idempoten (kiriman yang sama tidak menggandakan data).

Isi yang diterima: **No. MRP, nama vendor, nomor resi, ekspedisi, tanggal kirim, foto lampiran resi, No. koli, dan item tiap koli**
(warna, lengan, size, SKU, qty, jenis FG/REWORK). Item reject tidak dikirim.

## Pemasangan (sekitar 15 menit)

### 1. Supabase
1. Buat project di https://supabase.com (atau pakai project WOS yang sudah ada).
2. Buka **SQL Editor**, tempel seluruh isi `docs/erp-integrasi/supabase-erp-resi.sql`, klik **Run**.
   Ini membuat tabel `erp_resi`, `erp_resi_koli`, `erp_resi_item`, fungsi `erp_receive_resi`, dan bucket privat `erp-resi-files`.
3. Buka **Project Settings > API**, salin **Project URL** dan kunci **service_role** (rahasia, jangan dimasukkan ke GitHub atau chat umum).

### 2. Vercel (project WOS) — Settings > Environment Variables
| Nama | Isi |
| --- | --- |
| `SUPABASE_URL` | Project URL Supabase |
| `SUPABASE_SERVICE_KEY` | kunci `service_role` |
| `ERP_WEBHOOK_SECRET` | teks acak ≥ 32 karakter (dibuat satu pihak, **sama persis** dengan yang dipasang di ERP) |
| `ERP_VIEW_PASSWORD` | kata sandi untuk membuka halaman `/erp-resi.html` |
| `ERP_BASE_URL` | `https://mini-erp-tigalapan.vercel.app` (alamat ERP; fungsi hanya mau mengunduh lampiran dari alamat ini) |

Setelah mengisi, lakukan **Redeploy** supaya env terbaca.

### 3. Uji tanpa menunggu ERP
```
node docs/erp-integrasi/kirim-uji.mjs https://<alamat-wos>/api/erp-resi <ERP_WEBHOOK_SECRET>
```
Hasil benar: `HTTP 200 {"ok":true,...}`. Buka `https://<alamat-wos>/erp-resi.html`, masuk dengan `ERP_VIEW_PASSWORD`,
resi `AWB-UJI-001` harus tampil dan bisa dibuka untuk melihat koli dan itemnya. Hapus data uji dengan SQL:
`delete from erp_resi where resi_group_id = 'RESI-UJI-001';`

### 4. Beri tahu pemilik ERP
- Alamat endpoint: `https://<alamat-wos>/api/erp-resi`
- `ERP_WEBHOOK_SECRET` — kirim lewat jalur privat (bukan chat grup, bukan GitHub).

Pemilik ERP memasangnya di ERP sebagai `WOS_WEBHOOK_URL` dan `WOS_WEBHOOK_SECRET`.

## Format kiriman

Header: `X-ERP-Event: resi.created`, `X-ERP-Timestamp` (detik epoch), `X-ERP-Signature: sha256=<HMAC-SHA256(secret, "<timestamp>.<body mentah>")>`, `Idempotency-Key`.

```json
{
  "event": "resi.created",
  "eventId": "RESI-000123",
  "sentAt": "2026-10-28T03:15:10.000Z",
  "resi": {
    "resiGroupId": "RESI-000123", "resiNo": "AWB12360", "expedition": "WUS CARGO BANDUNG - MAKASSAR",
    "note": "", "shippingDate": "2026-10-27", "totalKoli": 2, "totalQty": 150,
    "mrpNumbers": ["W39"], "vendor": { "id": "cecep", "name": "CECEP" }
  },
  "kolis": [
    { "koliId": "KOLI-000456", "koliNo": "0032", "mrpNo": "W39", "weightKg": 47,
      "items": [ { "color": "BURGUNDY 24S", "sleeve": "PANJANG", "size": "L", "sku": "...", "qty": 150, "kind": "FG", "age": null } ] }
  ],
  "attachments": { "manifestUrl": "https://.../api/wos/resi-files?...", "expiresAt": "...", "files": [ { "index": 0, "fileName": "resi.jpg", "url": "https://..." } ] }
}
```

- `sleeve`: `PENDEK` / `PANJANG`. `kind`: `FG` / `REWORK`. `sku` bisa `null` kalau belum ada di Master SKU ERP.
- Satu resi bisa memuat koli dari lebih dari satu MRP (lihat `kolis[].mrpNo`).
- Lampiran dikirim sebagai tautan (berlaku 7 hari, tanpa login). Fungsi `api/erp-resi.js` mengunduhnya dan menyimpannya di Storage.

## Jalur utama: ERP -> spreadsheet gudang -> Inbound > Incoming

Mulai sekarang kiriman ERP juga ditulis ke tab **ERP_INCOMING** di spreadsheet "WOS Data Gudang". Supabase menjadi **opsional**
(arsip resi + lampiran); kalau `SUPABASE_*` tidak diisi, penerima tetap jalan dan hanya menulis ke spreadsheet.

Tambahan di Vercel > Environment Variables:
| Nama | Isi |
| --- | --- |
| `GUDANG_URL` | alamat Web App skrip gudang (yang berakhiran `/exec`) |
| `GUDANG_TOKEN` | token skrip gudang (rahasia, sama dengan yang dipakai WOS) |

Pasang ulang skrip `docs/google-sheets/gudang/Code.gs`, jalankan **setup** sekali (membuat tab `ERP_INCOMING` dan kolom `erp_nama`
di `MASTER_VENDOR`), lalu Deploy versi baru. Redeploy Vercel agar env terbaca.

**Bentuk baris ERP_INCOMING (satu item satu baris).** Koli berisi 3 item = 3 baris dengan `resi_group`, `resi`, `mrp`, `no_koli` yang sama:

| kolom | isi |
| --- | --- |
| `item` | satu nama item saja, mis. `SKY BLUE 24S PJG L` |
| `qty` | qty item itu (bukan total koli) |
| `hpp_per_item` | HPP per pcs (mis. 31017) |
| `hpp_total` | nilai baris = qty x `hpp_per_item` (mis. 8 x 31017 = 248136) |
| `hpp_estimasi` | isi `1` bila HPP masih perkiraan, kosong bila pasti |
| `id` | harus unik per baris, mis. `<resi>\|<koli>\|<mrp>\|<urutan>` |

`api/_erp.js` sudah menulis format ini. WOS tetap bisa membaca dua bentuk lama (JSON, dan teks satu sel `NAMA xQTY @HPP; NAMA xQTY @HPP`, tanda `~` = HPP estimasi), tetapi ERP yang menulis langsung ke sheet sebaiknya memakai bentuk satu item satu baris.

Aturan penerjemahan (di `api/_erp.js` dan `index.html`):
- **Nomor resi**: awalan `AWB` dibuang (`AWB12345`, `AWB 12345` -> `12345`). Dasar incoming adalah resi, bukan PO.
- **Kode PO** = awalan PO vendor (Master data > vendor > "Awalan kode PO", mis. `BY`) + nomor minggu MRP tanpa angka 0 di depan. Vendor BY + MRP `W40` = `BY40`; `W3` menjadi `BY3`. Untuk pola khusus tulis `{W}` sebagai tempat nomor minggu: `GI{W}-02` + `W3` = `GI3-02` (konveksi 02), `GI` saja + `W39` = `GI39`.
- **Pecah PO**: tombol "Pecah PO" di Incoming (Admin) membagi satu PO per nomor koli menjadi kategori, mis. `BY39` koli 1-5 `REG`, 6-10 `TUNIK`, 11-15 `KID` -> `BY39-REG`, `BY39-TUNIK`, `BY39-KID`. Aturan disimpan di tab `PO_PECAH` (jalankan setup dan deploy ulang skrip gudang setelah memperbarui Code.gs).
- **ETA** = tanggal kirim + 7 hari.
- Vendor ERP dicocokkan dengan Master vendor lewat nama, kode, atau alias `erp_nama`. Vendor yang belum cocok muncul di Inbound > Incoming dengan tombol **Petakan**.
- **Nomor koli** `0001` dibaca `1`.
- **Nama item** = `<warna> <PDK|PJG> <size>` (mis. `BENHUR SPECIAL 24S PDK M`).
- **Satu karung berisi dua MRP**: sertakan `mrpNo` di tiap item. Satu koli menjadi satu baris per MRP, sehingga di WOS koli nomor itu muncul di kedua PO dan Admin mengekspor ke MOKA per PO (BY40 terpisah dari BY41).
- **HPP**: sertakan `hpp` (angka per item, boleh `hppEstimated: true`) di tiap item. HPP per item diambil rata-rata tertimbang qty.
- Tombol **Mulai unloading** di Incoming membuat sesi unloading per resi, daftar koli per PO, serta mengisi surat jalan (`SJ_ITEM`) dan HPP (`HPP_ITEM`) otomatis.

## Untuk tab Inbound > Incoming (versi Supabase, lama)
Kolom **PO** di WOS = **nomor MRP** dari ERP, kolom **STTB** = nomor resi, Vendor dan Ekspedisi sama. Tampilan `erp_incoming` di SQL di atas
sudah menyiapkan data itu per MRP per resi (`po`, `vendor`, `sttb`, `ekspedisi`, `total_koli`, `koli_list`, `total_qty`).
Satu resi yang memuat dua MRP menjadi dua baris. Perhatian: nomor koli di ERP berulang antar vendor pada MRP yang sama
(mis. koli 0014 milik CECEP dan koli 0014 milik BAYU di MRP W39), jadi untuk Incoming pakai mode "STTB dengan nomor koli bebas"
(jumlah koli per STTB), bukan mencocokkan per nomor koli.

## Kode yang ditambahkan
- `api/erp-resi.js` — penerima (tanda tangan, simpan, unduh lampiran)
- `api/erp-resi-list.js` — pembaca daftar untuk halaman (dilindungi kata sandi)
- `api/_erp.js` — pembantu
- `erp-resi.html` — halaman daftar resi dari ERP
- `docs/erp-integrasi/*` — SQL, panduan ini, skrip uji

Tidak ada perubahan pada `index.html`, `sheets-config.js`, dan spreadsheet yang ada. Menghubungkan data `erp_resi` ke layar
Inbound di `index.html` (mis. sebagai pengganti impor Surat Jalan Excel) bisa dilakukan belakangan.
