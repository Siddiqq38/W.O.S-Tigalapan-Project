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

## Untuk tab Inbound > Incoming (menyusul)
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
