# Panduan membuat spreadsheet WOS Data Gudang (Inbound dan Outbound V2)

1. Buka https://sheets.google.com, klik **Kosong (Blank)**, beri nama **WOS Data Gudang**.
2. Klik **Ekstensi > Apps Script**.
3. Hapus semua isi `Code.gs`. Buka `WOS-Gudang-Apps-Script.txt` (folder Documents), Ctrl+A, Ctrl+C, lalu tempel di editor (Ctrl+V). Klik **Simpan**.
4. Pilih fungsi **setup** di dropdown atas, klik **Jalankan**. Izinkan akses bila diminta (Lanjutan > Buka ... > Izinkan).
5. Kembali ke spreadsheet: ada 8 tab (UNLOADING, STAGING_IN, MASTER_HPP, GR, STOK_BIN, SOQ, ASSIGNMENT, LOG).
6. Di Apps Script klik **Terapkan > Deployment baru > roda gigi > Aplikasi web**.
   Jalankan sebagai: **Saya**. Yang memiliki akses: **Siapa saja**. Klik **Terapkan**.
7. Salin **URL aplikasi web** (berakhiran /exec) dan kirim ke pengelola WOS.
